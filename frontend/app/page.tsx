"use client";

import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { SpeclyzeLogoFull } from '@/components/Logo';

export default function Home() {
  const [requirement, setRequirement] = useState("");
  const [testCases, setTestCases] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]); // New History State
  const [loading, setLoading] = useState(false);

  // Auto-capitalize the first letter
  const formatText = (text: string) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  // Fetch the history from SQLite backend
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/history`, {
        headers: {
          "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        }
      });
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      if (data.status === "success") {
        setHistory(data.data);
      }
    } catch (error) {
      console.error("History Error:", error);
    }
  };

  // Run the fetch the exact moment the page loads
  useEffect(() => {
    fetchHistory();
  }, []);

  const generateTests = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-tests`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "", 
      },
      body: JSON.stringify({
        requirement_text: requirement,
        complexity: "medium",
      }),
    });

    if (!response.ok) {
      throw new Error("Backend connection failed");
    }
    
    const data = await response.json();
    
    // ✨ Check for fallback response
    if (data.error_type === "invalid_requirement") {
      setTestCases(data.generated_test_cases);
      
      // 🎨 Professional warning toast
      toast.error(
        "Please provide a clear software requirement",
        {
          duration: 5000,
          icon: '⚠️',
        }
      );
      
      // Show a helpful hint toast after 1 second
      setTimeout(() => {
        toast(
          "Example: 'A user should be able to login with Google'",
          {
            duration: 8000,
            icon: '💡',
          }
        );
      }, 1000);
      
    } else {
      // ✅ Success!
      setTestCases(data.generated_test_cases);
      fetchHistory();
      
      // 🎉 Success toast
      toast.success('Test cases generated successfully!');
    }
    
  } catch (error) {
    console.error("Error:", error);
    
    // ❌ Error toast
    toast.error(
      'Cannot connect to backend. Please check your server.',
      {
        duration: 6000,
        icon: '🔥',
      }
    );
  }
  setLoading(false);
};

  // CSV Export
  const exportToCSV = () => {
    const headers = ["TC No", "Test Summary", "Test Description", "Precondition", "Step", "Action", "Test Data", "Expected Result"];
    let csvContent = headers.join(",") + "\n";
    
    testCases.forEach(tc => {
      tc.steps.forEach((step: any, index: number) => {
        const row = [
          index === 0 ? `"${tc.tc_no}"` : '""',
          index === 0 ? `"${formatText(tc.test_summary)}"` : '""',
          index === 0 ? `"${formatText(tc.test_description)}"` : '""',
          index === 0 ? `"${formatText(tc.precondition)}"` : '""',
          `"${step.step_number}"`,
          `"${formatText(step.action)}"`,
          `"${step.test_data}"`, 
          `"${formatText(step.expected_result)}"`
        ];
        csvContent += row.join(",") + "\n";
      });
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "TestGenius_Suite.csv";
    link.click();
  };

  return (
    <main className="min-h-screen p-8 bg-[#FAFAFA] text-slate-900 font-sans selection:bg-indigo-100 flex flex-col justify-between">
      <div className="max-w-[90rem] mx-auto space-y-10 w-full">
        
        {/* Modern Header with Speclyze Logo */}
        <div className="text-center pt-12 flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            
            {/* Calling our new clean Logo Component! */}
            <SpeclyzeLogoFull width={200} height={67} className="drop-shadow-xl transform hover:scale-105 transition-transform" />

          </div>
          
          <p className="text-[17px] text-slate-500 font-medium tracking-wide">
            Next-Generation Enterprise QA Copilot
          </p>
        </div>

        {/* Sleek Input Section */}
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-4xl mx-auto transition-all">
          
          {/* ✨ NEW QUICK-TRY PILLS ✨ */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Try an example:</span>
            {["🛒 Shopping Cart Checkout", "🔒 2FA Login Flow", "💳 Refund Processing"].map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setRequirement(`Verify the ${suggestion.substring(3).toLowerCase()} process.`)}
                className="text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">
            Define your Requirement
          </label>
          
          <textarea
            className="w-full p-5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none transition-all text-slate-700 text-lg shadow-inner bg-slate-50/50 focus:bg-white"
            rows={3}
            maxLength={500}
            placeholder="e.g., Verify that user can login successfully in the portal..."
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
          />
          
          {/* ✨ UPDATED HELPER TEXT & COUNTER ✨ */}
          <div className="mt-3 flex items-start justify-between gap-4 px-1">
            <div className="flex items-start gap-2 text-slate-500">
              <svg className="w-4 h-4 text-indigo-400 mt-[2px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs font-medium leading-relaxed">
                <span className="font-bold text-slate-600">Pro Tip:</span> For the best results, provide a clear software feature or user story. Conversational queries will not generate valid test cases.
              </p>
            </div>
            {/* The Character Counter */}
            <div className={`text-xs font-bold shrink-0 mt-[2px] ${requirement.length >= 500 ? 'text-rose-500' : 'text-slate-400'}`}>
              {requirement.length} / 500
            </div>
          </div>

          <button
            onClick={generateTests}
            disabled={!requirement || loading}
            className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl transform hover:-translate-y-[2px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Architecture...
              </span>
            ) : "Generate Test Suite ✨"}
          </button>
        </div>

        {/* --- NEW HISTORY SECTION --- */}
        {history.length > 0 && (
          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-4xl mx-auto transition-all mt-8">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
              <span>📚</span> Recent Test Suites
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {history.map((item) => (
                <div key={item.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center transition-colors">
                  <p className="text-sm text-slate-600 truncate w-3/4 font-medium">
                    {item.requirement_text}
                  </p>
                  <button
                    onClick={() => {
                      setTestCases(item.generated_json.generated_test_cases);
                      setRequirement(item.requirement_text); // Bonus: Auto-fills the input box too!
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow"
                  >
                    Load Suite 🔄
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2026 Enterprise Table Output */}
        {testCases.length > 0 && (
          <div className="animate-fade-in-up mt-12 mb-10">
            <div className="flex justify-between items-center mb-6 px-2">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Generated Suite</h2>
              <button 
                onClick={exportToCSV}
                className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-5 rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export CSV
              </button>
            </div>
            
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                {/* ✨ Added table-fixed and min-w-[1200px] to enforce strict column widths ✨ */}
                <table className="w-full text-sm text-left table-fixed min-w-[1200px]">
                  <thead className="text-[11px] text-slate-400 uppercase tracking-widest bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      {/* Explicit percentage widths for perfect balance */}
                      <th className="px-4 py-5 font-semibold w-[6%]">TC No</th>
                      <th className="px-4 py-5 font-semibold w-[14%]">Test Summary</th>
                      <th className="px-4 py-5 font-semibold w-[16%]">Test Description</th>
                      <th className="px-4 py-5 font-semibold w-[14%]">Precondition</th>
                      <th className="px-4 py-5 font-semibold text-center w-[6%]">Step</th>
                      <th className="px-4 py-5 font-semibold w-[16%]">Action</th>
                      <th className="px-4 py-5 font-semibold w-[14%]">Test Data</th>
                      <th className="px-4 py-5 font-semibold w-[14%]">Expected Result</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    {testCases.map((tc, tcIndex) => (
                      tc.steps.map((step: any, stepIndex: number) => (
                        <tr 
                          key={`${tcIndex}-${stepIndex}`} 
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-5 align-top font-semibold text-slate-900">
                            {stepIndex === 0 ? tc.tc_no : ""}
                          </td>
                          <td className="px-6 py-5 align-top font-medium text-slate-800">
                            {stepIndex === 0 ? formatText(tc.test_summary) : ""}
                          </td>
                          <td className="px-6 py-5 align-top max-w-xs leading-relaxed">
                            {stepIndex === 0 ? formatText(tc.test_description) : ""}
                          </td>
                          <td className="px-6 py-5 align-top max-w-xs leading-relaxed text-slate-500">
                            {stepIndex === 0 ? formatText(tc.precondition) : ""}
                          </td>
                          
                          <td className="px-6 py-5 align-top text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                              {step.step_number}
                            </span>
                          </td>
                          <td className="px-6 py-5 align-top text-slate-700">
                            {formatText(step.action)}
                          </td>
                          
                          <td className="px-4 py-5 align-top">
                            {step.test_data && step.test_data !== "N/A" ? (
                              <div className="block px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-mono text-xs break-words whitespace-normal shadow-sm">
                                {step.test_data}
                              </div>
                            ) : null}
                          </td>
                          
                          <td className="px-6 py-5 align-top text-emerald-700 font-medium">
                            {formatText(step.expected_result)}
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✨ ENTERPRISE SAAS FOOTER ✨ */}
      <footer className="mt-20 pb-8 border-t border-slate-200/60 pt-8 text-center w-full">
        <div className="flex justify-center items-center gap-2 mb-3">
          {/* Small Speclyze Icon */}
          <svg className="w-6 h-5" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 0,60 L 60,0 L 60,120 Z" fill="#7C3AED" opacity="0.95"/>
            <path d="M 60,0 L 100,60 L 60,120 Z" fill="#6366F1"/>
            <path d="M 100,60 L 160,0 L 160,120 Z" fill="#14B8A6" opacity="0.95"/>
          </svg>
          <p className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mt-1">Speclyze</p>
        </div>
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          © 2026 Speclyze. All rights reserved. <br/> 
          <span className="inline-block mt-1 opacity-75">Built for modern software engineering teams.</span>
        </p>
      </footer>
    </main>
  );
}