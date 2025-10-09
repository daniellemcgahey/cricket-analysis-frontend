import React, { useContext } from "react";
import { Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";              // ⬅️ use Link
import DarkModeContext from "../DarkModeContext";
import BackButton from "../components/BackButton";

export default function Training() {
  const { isDarkMode } = useContext(DarkModeContext);

  const containerClass = isDarkMode ? "bg-dark text-white" : "bg-light text-dark";
  const cardVariant = isDarkMode ? "dark" : "light";

  return (
    <div className={containerClass} style={{ minHeight: "100vh" }}>
      <div className="container-fluid py-4">
        <BackButton isDarkMode={isDarkMode} />

        <Row className="g-4">
          <Col md={4}>
            <Card
              bg={cardVariant}
              text={isDarkMode ? "light" : "dark"}
              className="h-100 shadow"
            >
              <Card.Body>
                <Card.Title className="fw-bold">Interactive Field</Card.Title>
                <Card.Text className="mb-3">
                  Drag & drop players to set a field. Supports Men/Women, PP/Middle/Death,
                  soft rule checks, and PDF export with bowler name + phase.
                </Card.Text>

                {/* Link style you’ve used before */}
                <Button as={Link} to="/training/interactive-field">
                  Open
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
