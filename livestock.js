import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA2XjNtmmqJRspCWHo86i-2xyjd4KafjPw",
    authDomain: "iotdash-101f7.firebaseapp.com",
    projectId: "iotdash-101f7",
    storageBucket: "iotdash-101f7.appspot.com",
    messagingSenderId: "950951407999",
    appId: "1:950951407999:web:620f8426db9c733a14aa4a",
    measurementId: "G-3Q22VZRTLE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchLiveStock() {
    const container = document.getElementById("live-stock-data");
    container.innerHTML = "<p>Loading live stock data...</p>";

    try {
        const snapshot = await getDocs(collection(db, "InventoryLogs"));
        container.innerHTML = "";

        if (snapshot.empty) {
            container.innerHTML = "<p>No live data found.</p>";
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data(); 
            console.log(" • product doc:", doc.id, data);

            const div = document.createElement("div");
            div.className = "box";
            div.innerHTML = `
                <div class="box-top">Product: ${data.product || "Unnamed"}</div>
                <div class="box-bottom">
                    <span>RFID: ${data.tag || "Unknown"}</span><br>
                    <span>Weight: ${data.weight ?? "?"} grams</span><br>
                    <span>Time: ${data.timestamp || "N/A"}</span>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error("❌ Error fetching live stock data:", error);
        container.innerHTML = "<p>Failed to load live stock data.</p>";
    }
}

fetchLiveStock();

