import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { db } from "./firebase.js";
import {
    getFirestore,
    collection,
    getDocs,
    onSnapshot,
    query,
    getDoc,
    doc,
    updateDoc,
    setDoc,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 🚫 CORS Protection Notice (only on local file://)
if (location.protocol === "file:") {
    alert("⚠️ Cannot run charts from file:// due to CORS. Please use a local server like:\n\npython3 -m http.server 8000\n\nThen open:\nhttp://localhost:8000/smart.html");
    throw new Error("CORS policy blocks Firebase requests over file://. Use http://localhost.");
    }

let itemsMovedChartInstance = null;
let fastMovingChartInstance = null;


async function fetchNotifications() {
    try {
        console.log("📡 Fetching notifications…");
        onSnapshot(collection(db, "notifications"), (snapshot) => {
            const notifications = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(" • notification doc:", doc.id, data);
                notifications.push(data);
            });

            renderNotifications(notifications); // Pass notifications directly
        });

    } catch (e) {
        console.error("❌ Firestore fetch failed for notifications:", e);
    }
}

function renderNotifications(notifications) {
    const notificationsContainer = document.getElementById("notifications-container");
    notificationsContainer.innerHTML = ""; // Clear old content

    if (notifications.length === 0) {
        notificationsContainer.innerHTML = "<p>No notifications available.</p>";
        return;
    }

    notifications.forEach(notification => {
        const notificationElement = document.createElement("p");
        if (notification.type) {
            notificationElement.classList.add(notification.type.toLowerCase().replace(" ", "-"));
        }
        notificationElement.innerHTML = `🔴 ${notification.type || "No Type"} <br> Product: ${notification.product || "Unknown Product"} <br> Stock Level: ${notification.stockLevel || "Unknown"}`;
        notificationsContainer.appendChild(notificationElement);
    });
}

// Fetch data for 'Items Moved' chart
async function fetchItemsMovedData() {
    try {
        console.log("📡 Fetching ordered itemsMoved data…");

        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const labels = [];
        const values = [];

        // Get today's day as a string
        const today = new Date();
        const todayWeekday = weekdays[today.getDay()]; // e.g., "Tuesday"

        for (const day of validDays) {
            const docRef = doc(db, "itemsmoved", day);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();

                // ✅ Update "date" field only if it's today
                if (day === todayWeekday) {
                    await updateDoc(docRef, {
                        date: todayWeekday,
                    });
                }

                labels.push(data.date ?? day); // fallback to doc ID if date is missing
                values.push(typeof data.value === "number" ? data.value : parseInt(data.value || "0", 10));
            } else {
                labels.push(day);
                values.push(0);
            }
        }

        renderItemsMovedChart(labels, values);
    } catch (e) {
        console.error("❌ Firestore fetch failed for itemsMoved:", e);
    }
}

// Add the function to handle the button click event
function goToLiveStock() {
    window.location.href = "livestock.html"; // Redirect to the Live Stock page
}

// Render bar chart for 'Items Moved'
function renderItemsMovedChart(labels, values) {
    const ctx = document.getElementById("itemsMovedChart").getContext("2d");

    if (itemsMovedChartInstance) {
        itemsMovedChartInstance.data.labels = labels;
        itemsMovedChartInstance.data.datasets[0].data = values;
        itemsMovedChartInstance.update();
        return;
    }

    itemsMovedChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Items Moved",
                data: values,
                backgroundColor: "rgba(54, 162, 235, 0.6)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                tooltip: { mode: 'index', intersect: false },
                hover: { mode: 'nearest', intersect: true }
            }
        }
    });
}

// Render doughnut chart for 'Fast Moving Items'
function renderFastMovingChart(labels, values) {
    const ctx = document.getElementById("fastMovingChart").getContext("2d");

    if (fastMovingChartInstance) {
        fastMovingChartInstance.data.labels = labels;
        fastMovingChartInstance.data.datasets[0].data = values;
        fastMovingChartInstance.update();
        return;
    }

    fastMovingChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Fast Moving Items',
                data: values,
                backgroundColor: ['#1abc9c', '#3498db']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'white',
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}


// Initialize both charts
async function initializeCharts() {
    await fetchItemsMovedData();
    await fetchFastMovingData();
}

// Initialize notifications and charts on page load
fetchNotifications();

// 🔄 Fetch and render dynamic boxes for products (left-side grid)
// 🔄 Real-time fetch and render for products (left-side grid)
function fetchProductBoxes() {
    console.log("📦 Listening for real-time updates to product boxes…");

    const boxGrid = document.querySelector("#product-list");
    boxGrid.innerHTML = ""; // Clear existing boxes initially

    const productsRef = collection(db, "products");

    onSnapshot(productsRef, snapshot => {
        console.log("🔁 Product snapshot updated:", snapshot.size);
        boxGrid.innerHTML = ""; // Clear and re-render everything

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(" • product doc:", doc.id, data);

            const box = document.createElement("div");
            box.className = "box";

            const formattedDate = data.last_updated?.toDate
                ? data.last_updated.toDate().toLocaleString()
                : "Unknown";

            box.innerHTML = `
                <div class="box-top font-bold text-lg mb-2">${data.product || "Unnamed Product"}</div>
                <div class="box-bottom text-sm space-y-1">
                    <div><strong>Weight:</strong> ${data.weight ?? "?"} g</div>
                    <div><strong>Items:</strong> ${data.item_count ?? "?"}</div>
                    <div><strong>Last Updated:</strong> ${formattedDate}</div>
                </div>
            `;

            boxGrid.appendChild(box);
        });
    }, error => {
        console.error("❌ Snapshot listener error for products:", error);
    });
}

async function incrementItemsMovedToday() {
    const today = new Date();
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = weekdays[today.getDay()];

    if (!["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day)) {
        console.log(`ℹ️ Skipping update: today is ${day}`);
        return;
    }

    const docRef = doc(db, "itemsmoved", day);
    const docSnap = await getDoc(docRef);

    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`; // MM/DD/YYYY

    if (docSnap.exists()) {
        const data = docSnap.data();
        const currentValue = typeof data.value === "number" ? data.value : parseInt(data.value || "0", 10);
        const newValue = currentValue + 1;

        await updateDoc(docRef, {
            value: newValue,
            date: formattedDate
        });

        console.log(`✅ Incremented '${day}' to ${newValue} on ${formattedDate}`);
    } else {
        await setDoc(docRef, {
            value: 1,
            date: formattedDate
        });

        console.log(`🆕 Created '${day}' document with value 1 and date ${formattedDate}`);
    }

    fetchItemsMovedData(); // Refresh chart
}


// 👁️ Real-time listener for latest RFID product entry
function startRFIDProductListener() {
    const rfidDisplay = document.getElementById("rfid-product-display");

    const q = query(collection(db, "display"), orderBy("timestamp", "desc"), limit(1));
    let lastTimestamp = null;
    let checkInterval = null;

    function formatElapsedMinutes(seconds) {
        const mins = Math.floor(seconds / 60);
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;

        if (mins < 1) return "less than a minute";

        if (hrs >= 1) {
            return `${hrs} hour${hrs > 1 ? 's' : ''} ${remMins} minute${remMins !== 1 ? 's' : ''}`;
        } else {
            return `${mins} minute${mins !== 1 ? 's' : ''}`;
        }
    }

    function showNoScanMessage(secondsElapsed) {
        rfidDisplay.innerHTML = `
            <div class="no-scan-message">
                <p><strong>No new item scanned for ${formatElapsedMinutes(secondsElapsed)}.</strong></p>
            </div>
        `;
    }

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            showNoScanMessage(0);
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const timestamp = data.timestamp?.seconds;

            // Clear and display the latest product info
            rfidDisplay.innerHTML = "";
            const productBox = document.createElement("div");
            productBox.className = "rfid-box";
            productBox.innerHTML = `
                <p><strong>Product:</strong> ${data.product || "Unknown"}</p>
                <p><strong>Weight:</strong> ${data.weight || "?"} grams</p>
                <p><strong>Tag:</strong> ${data.tag || "N/A"}</p>
                <p><strong>Time:</strong> ${new Date(timestamp * 1000).toLocaleString()}</p>
            `;
            rfidDisplay.appendChild(productBox);

            handleProductDetection(data.tag);
            incrementItemsMovedToday();

            // 🔄 Update charts when a new RFID scan is detected
            fetchItemsMovedData();
            fetchFastMovingData();
            

            lastTimestamp = timestamp;
            // Clear existing interval if any
            if (checkInterval) clearInterval(checkInterval);

            // Start a new interval that checks every 1 minute
            checkInterval = setInterval(() => {
                const now = Math.floor(Date.now() / 1000);
                const secondsElapsed = now - lastTimestamp;
                if (secondsElapsed >= 60) {
                    showNoScanMessage(secondsElapsed);
                }
            }, 60000); // 🔁 Check every 1 minute
        });
    });
}

async function fetchFastMovingData() {
    try {
        console.log("📡 Listening to fastmovingchart updates…");
        onSnapshot(collection(db, "fastmovingchart"), (snapshot) => {
            const labels = [];
            const values = [];

            let total = 0;
            const dataMap = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                labels.push(data.name);
                values.push(data.count || 0);
                dataMap.push({ label: data.name, count: data.count || 0 });
                total += data.count || 0;
            });

            // Convert to percentage values
            const percentageValues = dataMap.map(item =>
                total > 0 ? Math.round((item.count / total) * 100) : 0
            );

            renderFastMovingChart(labels, percentageValues);
        });
    } catch (e) {
        console.error("❌ Firestore fetch failed for fastMoving:", e);
    }
}


async function handleProductDetection(tagId) {
    const docIds = ["31df528", "3350ce24"];
    let matchedDocId = null;

    for (const docId of docIds) {
        const docRef = doc(db, "fastmovingchart", docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            if (tagId === docId) {
                matchedDocId = docId;
                const currentCount = data.count || 0;
                await updateDoc(docRef, {
                    count: currentCount + 1
                });
                console.log(`✅ Incremented count for ${data.name} (tag: ${tagId})`);
                break;
            }
        }
    }

    if (!matchedDocId) {
        console.log(`❌ No matching tag found for ${tagId}`);
    }
}



// 🔄 Start the RFID product listener on page load
startRFIDProductListener();



// 🟢 Load product boxes when page loads
fetchProductBoxes();


initializeCharts();