import { useState } from "react";
import Logo from "./Logo";
import Form from "./Form";
import PackingList from "./PackingList";
import Stats from "./Stats";

// const initialItems = [
//   { id: 1, description: "Passports", quantity: 2, packed: false },
//   { id: 2, description: "Socks", quantity: 12, packed: true },
// ];

export default function App() {
  const [items, setItems] = useState([]);

  function handleAddItems(item) {
    //immutable way, without mutating the original
    setItems((items) => [...items, item]);
  }
  function handleDeleteItems(itemId) {
    setItems((items) => items.filter((item) => item.id !== itemId));
  }

  function handleToggleItem(id) {
    setItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, packed: !item.packed } : item
      )
    );
  }

  function handleDelete(e) {
    const confirmation = window.confirm(
      "Are you sure you want to delete all items?"
    );
    if (confirmation) {
      setItems([]);
    }
  }
  return (
    <div>
      <Logo />
      <Form onAddItems={handleAddItems} />
      <PackingList
        items={items}
        setItems={setItems}
        onDeleteItem={handleDeleteItems}
        onToggle={handleToggleItem}
        onDelete={handleDelete}
      />
      <Stats items={items} />
    </div>
  );
}
