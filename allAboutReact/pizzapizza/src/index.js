import React from "react";
import ReactDOM from "react-dom/client";

//styles
import "./index.css";

const pizzaData = [
  {
    name: "Focaccia",
    ingredients: "Bread with italian olive oil and rosemary",
    price: 6,
    photoName: "pizzas/focaccia.jpg",
    soldOut: false,
  },
  {
    name: "Pizza Margherita",
    ingredients: "Tomato and mozarella",
    price: 10,
    photoName: "pizzas/margherita.jpg",
    soldOut: false,
  },
  {
    name: "Pizza Spinaci",
    ingredients: "Tomato, mozarella, spinach, and ricotta cheese",
    price: 12,
    photoName: "pizzas/spinaci.jpg",
    soldOut: false,
  },
  {
    name: "Pizza Funghi",
    ingredients: "Tomato, mozarella, mushrooms, and onion",
    price: 12,
    photoName: "pizzas/funghi.jpg",
    soldOut: false,
  },
  {
    name: "Pizza Salamino",
    ingredients: "Tomato, mozarella, and pepperoni",
    price: 15,
    photoName: "pizzas/salamino.jpg",
    soldOut: true,
  },
  {
    name: "Pizza Prosciutto",
    ingredients: "Tomato, mozarella, ham, aragula, and burrata cheese",
    price: 18,
    photoName: "pizzas/prosciutto.jpg",
    soldOut: false,
  },
];

function App() {
  return (
    <div className="container">
      <Header />
      <Menu />
      <Footer />
    </div>
  );
}

//header
function Header() {
  const style = { color: "red", fontSize: "48px", textTransform: "uppercase" };
  return (
    <header className="header">
      <h1>Fast React Pizza</h1>;
    </header>
  );
}
//Menu
function Menu() {
  const pizzas = pizzaData;
  const numPizzas = pizzas.length;
  return (
    <main className="menu">
      <h2>Our Menu</h2>
      {numPizzas > 0 ? (
        <>
          <p>Authentic Intalian cuisine. 6 creative dishes are here for you!</p>
          <ul className="pizzas">
            {pizzas.map((pizza) => (
              <Pizza pizzaObj={pizza} key={pizza.name} />
            ))}
          </ul>
        </>
      ) : (
        <p>We're still working on our menu. Please visit later.</p>
      )}
    </main>
  );
}

//footer
function Footer() {
  const hour = new Date().getHours();
  const openHour = 12;
  const closeHour = 22;
  const isOpen = hour >= openHour && hour <= closeHour;

  // if (!isOpen) {
  //   return <p>Sorry, we're closed at the moment.</p>;
  // }
  return (
    <footer className="footer">
      {isOpen && <Order closeHour={closeHour} />}
    </footer>
  );
}
function Order(props) {
  return (
    <div className="order">
      <p>
        We're open until {props.closeHour}:00. Come visit us or order online!
      </p>
      <button className="btn">Order Now</button>
    </div>
  );
}
function Pizza({ pizzaObj }) {
  // if (pizzaObj.soldOut) {
  //   return null;
  // }
  return (
    <li className={`pizza ${pizzaObj.soldOut && "sold-out"}`}>
      <img src={pizzaObj.photoName} alt={pizzaObj.name} />
      <div>
        <h3>{pizzaObj.name}</h3>
        <p>{pizzaObj.ingredients}</p>
        {/* <span> */}
        {pizzaObj.soldOut ? (
          <span>SOLD OUT</span>
        ) : (
          <span>{pizzaObj.price}</span>
        )}
        {/* {pizzaObj.soldOut ? "Sold Out" : Number(pizzaObj.price) + 3} */}
        {/* </span> */}
      </div>
    </li>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
