// src/components/UserTable.js
import React from "react";

export default function UserTable({ users, highlightIp, cardIp, onShowCard, onShowInfo }) {

  const isOnline = (u) => u.currentPage && u.currentPage !== "offline";

  const sortedEntries = [...Object.entries(users)].sort(([, a], [, b]) => {
    return (b.lastActivityAt || 0) - (a.lastActivityAt || 0);
  });

  const handleDelete = async (ip) => {
    if (!window.confirm(`Delete all data for ${ip}?`)) return;
    try {
      const serverUrl = process.env.REACT_APP_SERVER_URL || "";
      const res = await fetch(`${serverUrl}/api/users/${encodeURIComponent(ip)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <table className="table table-striped table-bordered">
      <thead className="table-light">
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>New Data</th>
          <th>Card</th>
          <th>Page</th>
          <th>Status</th>
          <th>Info</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        {sortedEntries.map(([ip, u], i) => {
          const isHighlighted = ip === highlightIp || ip === cardIp;
          const rowStyle = {
            border: isHighlighted ? "2px solid #28a745" : undefined,
            background: u.flag ? "yellow" : undefined,
            boxShadow: u.hasPayment ? "inset 4px 0 #28a745" : undefined,
          };
          const nameCellStyle = u.hasPayment
            ? { background: "#d4edda", color: "#155724", fontWeight: 700 }
            : undefined;

          const displayName = u.userName || u.FullName || "—";

          return (
            <tr key={ip} style={rowStyle}>
              <td>{i + 1}</td>
              <td style={nameCellStyle}>
                {displayName}
                {u.hasPayment && <span className="badge bg-success text-white ms-2">PAID</span>}
              </td>
              <td>
                <span className={`font-weight-bold ${u.hasNewData ? "text-success" : "text-danger"}`}>
                  {u.hasNewData ? "Yes" : "No"}
                </span>
              </td>
              <td>
                <button className="btn btn-success btn-sm" onClick={() => onShowCard(ip)}>Card</button>
              </td>
              <td>{(u.currentPage || "offline").replace(".html", "")}</td>
              <td>
                <span className={`font-weight-bold ${isOnline(u) ? "text-success" : "text-danger"}`}>
                  {isOnline(u) ? "Online" : "Offline"}
                </span>
              </td>
              <td>
                <button className="btn btn-info btn-sm" onClick={() => onShowInfo(ip)}>Info</button>
              </td>
              <td>
                <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(ip)}>Delete</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
