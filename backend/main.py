from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import os
import re

app = FastAPI()

# Enable CORS for all origins (you can restrict this later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Excel cache
excel_data = {}

# Utility to flatten sheets into one DataFrame
def flatten_excel(sheet_dict, source_label):
    all_rows = []
    for sheet_name, df in sheet_dict.items():
        df = df.copy()
        df["source"] = source_label
        df["sheet"] = sheet_name
        all_rows.append(df)
    return pd.concat(all_rows, ignore_index=True)

# Load and cache Excel file
def load_excel_data(key, path, label):
    if not os.path.exists(path):
        raise RuntimeError(f"File not found: {path}")
    df_dict = pd.read_excel(path, sheet_name=None)
    excel_data[key] = flatten_excel(df_dict, label)
    print(f"✅ Loaded {key} ({len(excel_data[key])} rows)")

# Normalize a string for matching
def normalize(val):
    if pd.isna(val):
        return ""
    return re.sub(r"[^a-z0-9]", "", str(val).lower())

# Dynamically create search endpoints
def create_search_route(key):
    async def route(q: str = Query(None), page: int = 1, page_size: int = 30):
        if key not in excel_data:
            return JSONResponse(status_code=404, content={"error": f"{key} not loaded"})

        df = excel_data[key].copy()

        if q:
            norm_q = normalize(q)
            df = df[df.apply(
                lambda row: any(
                    norm_q in normalize(v)
                    for k, v in row.items()
                    if k not in ["source", "sheet"]
                ),
                axis=1
            )]

        df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
        total = len(df)
        start = (page - 1) * page_size
        end = start + page_size

        return JSONResponse(content={
            "results": df.iloc[start:end].to_dict(orient="records"),
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": end < total
        })

    return route

# List of Excel files to load
EXCEL_FILES = {
    "engines": ("data/engines.xlsx", "Engines"),
    "filters": ("data/filters.xlsx", "Filters"),
    "sparkplugs": ("data/sparkplugs.xlsx", "Spark Plugs"),
}

# Load all defined Excel files
for key, (path, label) in EXCEL_FILES.items():
    try:
        load_excel_data(key, path, label)
        app.get(f"/api/{key}")(create_search_route(key))
    except Exception as e:
        print(f"❌ Failed to load {key}: {e}")

# API route to manually refresh any file
@app.post("/api/refresh/{key}")
def refresh_file(key: str):
    if key not in EXCEL_FILES:
        return JSONResponse(status_code=404, content={"error": f"Unknown key: {key}"})
    path, label = EXCEL_FILES[key]
    try:
        load_excel_data(key, path, label)
        return {"status": "reloaded", "rows": len(excel_data[key])}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# Simple health check
@app.get("/api/test")
def test():
    return {"status": "ok"}

# Entry point (optional if using uvicorn CLI)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
