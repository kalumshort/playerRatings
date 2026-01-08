import React, { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app"; // Assumes you initialized Firebase in your app

const BackfillButton = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");

  const handleBackfill = async () => {
    setLoading(true);
    setLogs([]);
    setStatusMsg("");

    try {
      // 1. Initialize Functions
      const functions = getFunctions(getApp());

      // 2. Create the reference to your backend function
      // match the name 'backfillFixtures' exactly with exports.backfillFixtures
      const backfillFn = httpsCallable(functions, "backfillFixtures");

      // 3. Call it! (You can pass arguments here)
      const result = await backfillFn({ date: "2026-01-07" });

      const data = result.data; // Access the return object from backend

      if (data.success) {
        setStatusMsg(data.message);
        setLogs(data.logs);
      } else {
        setStatusMsg(data.message || "Operation failed without error.");
      }
    } catch (error) {
      console.error("Firebase Function Error:", error);
      setStatusMsg(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "400px" }}
    >
      <button
        onClick={handleBackfill}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
          backgroundColor: loading ? "#b0bec5" : "#007BFF",
          color: "white",
          border: "none",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {loading ? "Processing Games..." : "Backfill Jan 7th Matches"}
      </button>

      {/* Output Area */}
      {(statusMsg || logs.length > 0) && (
        <div style={{ marginTop: "20px", fontSize: "14px" }}>
          {statusMsg && (
            <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
              {statusMsg}
            </div>
          )}

          {logs.map((log, index) => (
            <div
              key={index}
              style={{
                padding: "4px 0",
                color: log.includes("Failed") ? "red" : "green",
                borderBottom: "1px solid #eee",
              }}
            >
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BackfillButton;
