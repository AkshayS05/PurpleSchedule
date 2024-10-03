import { useState } from "react";
import Item from "./Item";

export default function PackingList({
  items,
  setItems,
  onDeleteItem,
  onToggle,
  onDelete,
}) {
  const [sortBy, setSortBy] = useState("input");
  let sortedItems;
  if (sortBy === "input") {
    sortedItems = items;
  }
  if (sortBy === "description") {
    sortedItems = items
      .slice()
      .sort((a, b) => a.description.localeCompare(b.description));
  }
  if (sortBy === "packed") {
    sortedItems = items.slice().sort((a, b) => Number(a.packed) - b.packed);
  }

  return (
    <div className="list">
      <ul>
        {sortedItems.map((item) => (
          <Item
            onDeleteItem={onDeleteItem}
            item={item}
            key={item.id}
            onToggle={onToggle}
          />
        ))}
      </ul>
      <div className="actions">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="input">Sort By Input Order</option>
          <option value="description">Sort By Description Order</option>
          <option value="packed">Sort By Packed Status</option>
        </select>
        <button onClick={onDelete}>Clear List</button>
      </div>
    </div>
  );
}
