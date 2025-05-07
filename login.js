import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { db, auth } from "./firebase.js"; // ✅ now importing auth too



// 🚫 CORS Protection Notice (only on local file://)
if (location.protocol === "file:") {
    alert("⚠️ Cannot run charts from file:// due to CORS. Please use a local server like:\n\npython3 -m http.server 8000\n\nThen open:\nhttp://localhost:8000/smart.html");
    throw new Error("CORS policy blocks Firebase requests over file://. Use http://localhost.");
}


document.getElementById("loginBtn").addEventListener("click", async (e) => {
    e.preventDefault(); // ✅ prevent default form submission behavior

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorEl = document.getElementById("error");

    console.log("Trying login for:", email); // ✅ useful for debugging

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "smart.html"; // ✅ redirect on success
    } catch (error) {
        console.error("Login failed:", error); // ✅ for better debugging
        errorEl.textContent = "❌ " + error.message;
    }
});
