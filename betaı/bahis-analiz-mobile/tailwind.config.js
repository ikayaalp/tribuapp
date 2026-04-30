// tailwind.config.js
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0f172a",
        surface: "#1e293b",
        primary: "#84cc16",
        secondary: "#facc15",
        accent: "#3b82f6",
        muted: "#64748b",
        card: "#1e293b",
        "card-foreground": "#f8fafc",
      },
    },
  },
  plugins: [],
};
