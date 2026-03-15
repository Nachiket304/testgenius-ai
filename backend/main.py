import os
import json
import sqlite3
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import APIKeyHeader
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from anthropic import Anthropic
from schemas import TestGenerationRequest, TestGenerationResponse

# 1. Load Secrets
load_dotenv(override=True)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
SECRET_API_KEY = os.getenv("API_KEY")

if not ANTHROPIC_API_KEY or not SECRET_API_KEY:
    raise ValueError("❌ Missing API Keys! Check your .env file.")

print(f"\n=========================================")
print(f"🧠 AI: Online (Claude Opus 4.1)")
print(f"🔒 Security: API Key Authentication ACTIVE")
print(f"💾 Database: Connected to Local SQLite")
print(f"=========================================\n")

# 2. Security Setup
api_key_header = APIKeyHeader(name="X-API-Key")

def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != SECRET_API_KEY:
        raise HTTPException(status_code=403, detail="Access Denied: Invalid API Key")
    return api_key

# 3. Initialize App & Clients
ai_client = Anthropic(api_key=ANTHROPIC_API_KEY)
app = FastAPI(
    title="Speclyze API",
    description="AI-Powered Specification Analysis & Test Generation"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",            # Your local frontend
        "https://speclyze.vercel.app/", # Your future Vercel frontend
        "*"                                 # Temporary wildcard so Render testing doesn't fail
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Error Handler (Production Ready)
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"❌ Global Error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "An internal server error occurred."}
    )

# 4. Initialize Local Database
DB_FILE = "speclyze_memory.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS test_suites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            requirement_text TEXT NOT NULL,
            generated_json TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

SYSTEM_PROMPT = """You are an Enterprise QA Lead AI that ONLY outputs JSON.

CRITICAL RULES (NEVER VIOLATE):
1. ALWAYS return valid JSON in the exact format specified
2. NEVER output conversational text, explanations, or apologies
3. NEVER break the JSON structure under any circumstances

INPUT VALIDATION:
- If input is a valid software requirement → Generate comprehensive test cases
- If input is conversational, vague, unclear, or not a requirement → Return fallback JSON

FALLBACK JSON FORMAT (for invalid inputs):
{
  "project_name": "⚠️ Error: Invalid Input",
  "error_type": "invalid_requirement",
  "generated_test_cases": [
    {
      "tc_no": "TC-ERR",
      "test_summary": "⚠️ Invalid Input - Requirement Needed",
      "test_description": "The input provided was not a clear software requirement. Please provide a specific feature, user story, or functionality to test.",
      "precondition": "A valid software requirement must be provided",
      "steps": [
        {
          "step_number": 1,
          "action": "Provide a clear software requirement",
          "test_data": "Example: 'A user should be able to login with Google'",
          "expected_result": "A specific, testable software requirement"
        }
      ]
    }
  ]
}

VALID INPUT FORMAT (for proper requirements):
{
  "project_name": "Name of the feature being tested",
  "generated_test_cases": [
    {
      "tc_no": "TC-001",
      "test_summary": "Descriptive summary",
      "test_description": "Detailed description",
      "precondition": "State before test",
      "steps": [
        {
          "step_number": 1,
          "action": "What to do",
          "test_data": "Input data",
          "expected_result": "Expected outcome"
        }
      ]
    }
  ]
}

Generate 8 test cases for valid requirements: Positive, Negative, and Edge case and highly detailed and comprehensive. Do not more than 8 test cases. Always ensure the JSON is properly formatted and valid.
"""

@app.get("/")
def read_root():
    return {"status": "active", "message": "TestGenius AI API is secured and online!"}

# NOTICE: We added the dependency here!
@app.post("/generate-tests", response_model=TestGenerationResponse, dependencies=[Depends(verify_api_key)])
async def generate_tests(request: TestGenerationRequest):
    print(f"🧠 Asking Claude to analyze: {request.requirement_text[:50]}...")
    
    # 1. Generate Tests with Claude
    message = ai_client.messages.create(
        model="claude-opus-4-1", 
        max_tokens=4096,  # 👈 INCREASE THIS NUMBER
        temperature=0.2,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": f"Generate enterprise test cases for this requirement: {request.requirement_text}"}
        ]
    )
    
    raw_content = message.content[0].text
    
    if raw_content.startswith("```json"):
        raw_content = raw_content.replace("```json\n", "").replace("```", "").strip()
    elif raw_content.startswith("```"):
        raw_content = raw_content.replace("```\n", "").replace("```", "").strip()
        
    # Parse JSON with a safety net
    try:
        data = json.loads(raw_content)
    except json.JSONDecodeError as json_err:
        print(f"❌ AI JSON Format Error: {json_err}")
        print(f"Raw Output causing error: {raw_content}")
        raise HTTPException(status_code=500, detail="The AI generated incomplete data. Please try again with a slightly shorter requirement.")
    print("✅ Successfully generated AI test cases!")

    # 2. Save to SQLite
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO test_suites (requirement_text, generated_json) VALUES (?, ?)",
            (request.requirement_text, json.dumps(data))
        )
        conn.commit()
        conn.close()
    except Exception as db_err:
        print(f"⚠️ Database Warning: {db_err}")
    
    return data

# NOTICE: We added the dependency here too!
@app.get("/api/history", dependencies=[Depends(verify_api_key)])
async def get_history():
    print("📂 Fetching test history for the UI...")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, created_at, requirement_text, generated_json 
        FROM test_suites 
        ORDER BY id DESC LIMIT 10
    ''')
    rows = cursor.fetchall()
    conn.close()

    history = []
    for row in rows:
        history.append({
            "id": row[0],
            "created_at": row[1],
            "requirement_text": row[2],
            "generated_json": json.loads(row[3]) 
        })
    
    return {"status": "success", "data": history}