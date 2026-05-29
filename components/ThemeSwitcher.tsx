"use client";

import { useState, useEffect } from "react";
import { MoonIcon as Moon, SunIcon as Sun } from "@heroicons/react/24/outline";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") || "light";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun width={20} height={20} className="text-yellow-500" />
      ) : (
        <Moon width={20} height={20} className="text-blue-600" />
      )}
    </button>
  );
}
