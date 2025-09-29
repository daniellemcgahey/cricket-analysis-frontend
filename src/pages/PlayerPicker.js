// PlayerPicker.jsx
import React, { useMemo, useState } from "react";
import { Form, Spinner, Button, Badge, InputGroup } from "react-bootstrap";

export default function PlayerPicker({
  title,
  countries,
  valueCountry,
  onChangeCountry,
  loading,
  players,
  selectedIds,
  setSelectedIds,
  teamCategory = "Women",
  onSelectProbableXI,      // async: () => Promise<number[]>
  max = 11,
}) {
  const [filter, setFilter] = useState("");

  const filteredPlayers = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return players;
    return players.filter(p =>
      (p.name || "").toLowerCase().includes(f) ||
      (p.role || "").toLowerCase().includes(f)
    );
  }, [players, filter]);

  const count = selectedIds.length;

  const toggle = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < max
          ? [...prev, id]
          : prev
    );
  };

  const selectNone = () => setSelectedIds([]);
  const selectAllVisible = () => {
    // convenience in case you want “select all” for warmups; still capped at max
    const ids = filteredPlayers.map(p => p.id).slice(0, max);
    setSelectedIds(ids);
  };

  const handleProbable = async () => {
    if (!onSelectProbableXI) return;
    const ids = await onSelectProbableXI();
    if (Array.isArray(ids) && ids.length) {
      setSelectedIds(ids.slice(0, max));
    }
  };

  return (
    <div>
      <Form.Group>
        <Form.Label><strong>{title}</strong></Form.Label>
        <Form.Select value={valueCountry} onChange={e => onChangeCountry(e.target.value)}>
          <option value="">Select</option>
          {countries.map(c => <option key={c}>{c}</option>)}
        </Form.Select>
      </Form.Group>

      <div className="d-flex align-items-center gap-2 mt-2">
        <Badge bg={count === max ? "success" : "secondary"}>{count}/{max} selected</Badge>
        <Button variant="outline-secondary" size="sm" onClick={selectNone}>Deselect all</Button>
        <Button variant="outline-secondary" size="sm" onClick={selectAllVisible}>Select visible</Button>
        <Button variant="primary" size="sm" onClick={handleProbable} disabled={!valueCountry}>
          Select Probable XI
        </Button>
      </div>

      <InputGroup className="mt-2">
        <Form.Control
          placeholder="Search name or role…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </InputGroup>

      {loading ? (
        <Spinner animation="border" className="mt-3" />
      ) : (
        <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid #ccc", padding: 10, borderRadius: 6 }} className="mt-2">
          {filteredPlayers.map(p => (
            <Form.Check
              key={p.id}
              type="checkbox"
              id={String(p.id)}
              label={
                <span>
                  {p.name}{" "}
                  {p.role && <Badge bg="info" className="ms-1">{p.role}</Badge>}
                  {p.form && <Badge bg="warning" className="ms-1">Form: {p.form}</Badge>}
                </span>
              }
              checked={selectedIds.includes(p.id)}
              onChange={() => toggle(p.id)}
            />
          ))}
          {!filteredPlayers.length && <div className="text-muted">No players match your filter.</div>}
        </div>
      )}
    </div>
  );
}
