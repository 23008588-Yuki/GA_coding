document.addEventListener("DOMContentLoaded", function() {

    console.log("DOM fully loaded and parsed");

    function getUsers() {
        return JSON.parse(localStorage.getItem("users")) || [];
    }

    function saveUsers(users) {
        localStorage.setItem("users", JSON.stringify(users));
    }

    function getCurrentUser() {
        return JSON.parse(localStorage.getItem("loggedInUser"));
    }

    function saveCurrentUser(user) {
        localStorage.setItem("loggedInUser", JSON.stringify(user));
    }

    function updateUser(user) {
        const users = getUsers();
        const index = users.findIndex(u => u.email === user.email);
        if (index !== -1) {
            users[index] = user;
            saveUsers(users);
            saveCurrentUser(user);
        }
    }

    // Check login state
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const loggedInUser = getCurrentUser();

    // Function to update the visibility of sections
    function updateSections() {
        const investingSection = document.getElementById('investing-section');
        const amlSection = document.getElementById('aml-section');

        if (isLoggedIn && loggedInUser) {
            if (amlSection) amlSection.style.display = 'block';
            if (investingSection) investingSection.style.display = 'none';
        } else {
            if (amlSection) amlSection.style.display = 'none';
            if (investingSection) investingSection.style.display = 'block';
        }
    }
    const authButtons = document.getElementById("auth-buttons");

    function updateNavbar() {
        if (isLoggedIn && loggedInUser) {
            authButtons.innerHTML = `
                <li class="nav-item">
                    <span class="nav-link"><a href="profile.html" style="color: black; margin-right: 10px;">Welcome, ${loggedInUser.name}</a></span>
                </li>
                <li class="nav-item">   
                    <button class="btn btn-danger" onclick="logout()">Logout</button>
                </li>
            `;
        } else {
            authButtons.innerHTML = `
                <li class="nav-item">
                    <a class="btn btn-white" style="width: 140px; border: 2px solid #007bff; color: #007bff; margin-right: 10px; border-radius: 5px" href="/login.html">Log in</a>
                </li>
                <li class="nav-item">
                    <a class="btn btn-primary" style="width: 140px; border-radius: 5px" href="/signup.html">Sign up</a>
                </li>
            `;
        }
    }

    function shouldRunScripts() {
        const currentPath = window.location.pathname;
        return !(currentPath.endsWith("/login.html") || currentPath.endsWith("/signup.html"));
    }
    
    if (shouldRunScripts()) {
        updateNavbar();
        updateSections();
    }



    // Handle login form submission
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            const users = getUsers();
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                localStorage.setItem("isLoggedIn", "true");
                saveCurrentUser(user);
                window.location.href = "/homepage.html";
            } else {
                alert("Invalid email or password");
            }
        });
    }

    // Handle profile information display
    if (window.location.pathname.endsWith("/profile.html")) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        console.log("Current user data:", currentUser);
        

        if (isLoggedIn && loggedInUser) {
            document.getElementById('display-name').textContent = loggedInUser.name || 'N/A';
            document.getElementById('display-email').textContent = loggedInUser.email || 'N/A';
            document.getElementById('display-password').textContent = loggedInUser.password || 'N/A';
            document.getElementById('display-country').textContent = loggedInUser.country || 'N/A';
        } else {
            // Redirect to signup if no user is found
            console.log("No current user found, redirecting to signup");
            window.location.href = 'signup.html';
        }
    }

    // Handle signup form submission
    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
        signupForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const country = document.getElementById("country").value;

            const newUser = { name, email, password, country, balance: 0, transactions: [] };
            const users = getUsers();
            users.push(newUser);
            saveUsers(users);

            window.location.href = "/login.html";
        });
    }
                    

    // Handle logout
    window.logout = function() {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("loggedInUser");
        window.location.href = "/login.html";
    };

    // Load dashboard data
    window.loadDashboard = function() {
        const user = getCurrentUser();
        if (!user) return;

        document.getElementById('balance').textContent = user.balance.toFixed(2);

        const transactionTableBody = document.getElementById('transaction-table-body');
        transactionTableBody.innerHTML = '';
        user.transactions.forEach(transaction => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${transaction.asset || 'Top up'}</td>
                <td>${transaction.date}</td>
                <td>${transaction.reference}</td>
                <td>${transaction.amount}</td>
                <td>${transaction.status}</td>
            `;
            transactionTableBody.appendChild(tr);
        });
    };

    // Redirect to the dashboard page
    function backhome() {
        window.location.href = 'dashboard.html';
    }

    // Make the functions available in the global scope
    window.backhome = backhome;

    // Handle top-up amount setting
    window.setAmount = function(amount) {
        document.getElementById('amount').value = amount;
    };

    window.continueTopUp = function() {
        const amount = parseFloat(document.getElementById('amount').value);
        if (isNaN(amount) || amount <= 0) {
            alert('Please select a valid amount to top up');
            return;
        }
        localStorage.setItem('topUpAmount', amount);
        window.location.href = 'checkout.html';
    };

    // Process payment and update user balance
    window.processPayment = function() {
        const amount = parseFloat(localStorage.getItem('topUpAmount'));
        const cardNumber = document.getElementById('cardNumber').value;
        const cardHolderName = document.getElementById('cardHolderName').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;

        if (cardNumber && cardHolderName && expiryDate && cvv && !isNaN(amount) && amount > 0) {
            const user = getCurrentUser();
            if (!user) return;

            user.balance += amount;
            user.transactions.push({ asset: 'Top up', amount: `+${amount.toFixed(2)}`, date: new Date().toLocaleString(), reference: Math.floor(Math.random() * 1000000), status: 'Successful' });
            updateUser(user);

            // Clear card information after processing
            document.getElementById('cardNumber').value = '';
            document.getElementById('cardHolderName').value = '';
            document.getElementById('expiryDate').value = '';
            document.getElementById('cvv').value = '';

            window.location.href = 'dashboard.html';
        } else {
            alert('Please fill in all the card details');
        }
    };

    // Load user balance on homepage
    window.loadHomePage = function() {
        const user = getCurrentUser();
        if (!user) return;

        document.getElementById('total-balance').textContent = `$${user.balance.toFixed(2)}`;

        // Update welcome message
        const userName = user.name || user.email;
        document.getElementById('user-name').textContent = userName;

        // Load transactions on bitcoin page
        if (window.location.pathname === '/bitcoin.html') {
            const transactionTableBody = document.getElementById('transaction-table-body');
            transactionTableBody.innerHTML = '';
            user.transactions.forEach(transaction => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${transaction.asset || 'Top up'}</td>
                    <td>${transaction.date}</td>
                    <td>${transaction.reference}</td>
                    <td>${transaction.amount}</td>
                    <td>${transaction.status}</td>
                `;
                transactionTableBody.appendChild(tr);
            });
        }
    };

    // Handle coin purchase
    window.buyCoin = function() {
        const coin = document.getElementById('coin').value;
        const amount = parseFloat(document.getElementById('amount').value);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const user = getCurrentUser();
        if (!user) return;

        if (user.balance < amount) {
            alert('Insufficient balance');
            return;
        }

        user.balance -= amount;
        const transaction = {
            asset: coin,
            amount: `-${amount.toFixed(2)}`,
            date: new Date().toLocaleString(),
            reference: Math.floor(Math.random() * 1000000),
            status: 'Successful'
        };
        user.transactions.push(transaction);
        updateUser(user);

        document.getElementById('total-balance').textContent = `$${user.balance.toFixed(2)}`;

        // Update transactions table on bitcoin page
        if (window.location.pathname === '/bitcoin.html') {
            const transactionTableBody = document.getElementById('transaction-table-body');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${transaction.asset}</td>
                <td>${transaction.date}</td>
                <td>${transaction.reference}</td>
                <td>${transaction.amount}</td>
                <td>${transaction.status}</td>
            `;
            transactionTableBody.appendChild(tr);
        }

        // Update transactions on dashboard page
        if (window.location.pathname === '/dashboard.html') {
            loadDashboard();
        }
    };

    // Handle coin selling
    window.sellCoin = function() {
        const coin = document.getElementById('coin').value;
        const amount = parseFloat(document.getElementById('amount').value);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const user = getCurrentUser();
        if (!user) return;

        user.balance += amount;
        const transaction = {
            asset: coin,
            amount: `+${amount.toFixed(2)}`,
            date: new Date().toLocaleString(),
            reference: Math.floor(Math.random() * 1000000),
            status: 'Successful'
        };
        user.transactions.push(transaction);
        updateUser(user);

        document.getElementById('total-balance').textContent = `$${user.balance.toFixed(2)}`;

        // Update transactions table on bitcoin page
        if (window.location.pathname === '/bitcoin.html') {
            const transactionTableBody = document.getElementById('transaction-table-body');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${transaction.asset}</td>
                <td>${transaction.date}</td>
                <td>${transaction.reference}</td>
                <td>${transaction.amount}</td>
                <td>${transaction.status}</td>
            `;
            transactionTableBody.appendChild(tr);
        }

        // Update transactions on dashboard page
        if (window.location.pathname === '/dashboard.html') {
            loadDashboard();
        }
    };

    // Show exchange form
    window.showExchangeForm = function() {
        document.getElementById('exchange-form').style.display = 'block';
    };

    // Handle coin exchange
    window.exchangeCoin = function() {
        const reference = document.getElementById('transaction-reference').value;
        const newCoin = document.getElementById('new-coin').value;

        console.log("Reference:", reference);
        console.log("New Coin:", newCoin);

        const user = getCurrentUser();
        if (!user) return;

        const transaction = user.transactions.find(t => t.reference && t.reference.toString() === reference);
        console.log("Transaction Found:", transaction);
        if (!transaction) {
            alert('Transaction not found');
            return;
        }

        transaction.asset = newCoin;
        updateUser(user);

        console.log("Updated User:", user);

        // Refresh transactions table on bitcoin page
        if (window.location.pathname === '/bitcoin.html') {
            const transactionTableBody = document.getElementById('transaction-table-body');
            transactionTableBody.innerHTML = '';
            user.transactions.forEach(transaction => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${transaction.asset}</td>
                    <td>${transaction.date}</td>
                    <td>${transaction.reference}</td>
                    <td>${transaction.amount}</td>
                    <td>${transaction.status}</td>
                `;
                transactionTableBody.appendChild(tr);
            });
        }


    // Show Transfer Form
    window.transferMoney = function() {
        document.getElementById('transfer-form').style.display = 'block';
    };

    // Handle Money Transfer
    window.MoneyTransfer = function() {
        const recipient = document.getElementById('transfer-recipient').value;
        const amount = document.getElementById('transfer-amount').value;

        console.log("Recipient:", recipient);
        console.log("Amount:", amount);

        const user = getCurrentUser();
        if (!user) return;

        // Find a transaction to update (assuming you're looking for a transaction by recipient)
        const transfer = user.transfer.find(t => t.recipient && t.recipient.toString() === recipient);
        console.log("Transfer Found:", transfer);
        if (!transfer) {
            alert('Transfer not found');
            return;
        }

        transfer.amount += parseFloat(amount); // Assuming you want to add the amount to existing transaction
        updateUser(user);

        console.log("Updated User:", user);

        // Refresh the transaction table 
        if (window.location.pathname === '/bitcoin.html') {
            const transactionTableBody = document.getElementById('transaction-table-body');
            transactionTableBody.innerHTML = '';
            user.transfer.forEach(transfer => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${transfer.asset}</td>
                    <td>${transfer.date}</td>
                    <td>${transfer.recipient}</td> <!-- Assuming recipient is part of the transaction -->
                    <td>${transfer.amount}</td>
                    <td>${transfer.status}</td>
                `;
                transactionTableBody.appendChild(tr);
            });

            // Populate the completed transactions table
            const completedTransactionsTableBody = document.getElementById('completed-transactions-table-body');
            completedTransactionsTableBody.innerHTML = '';
            user.transfer.filter(transfer => transfer.status === 'completed').forEach(transfer => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${transfer.asset}</td>
                    <td>${transfer.date}</td>
                    <td>${transfer.recipient}</td>
                    <td>${transfer.amount}</td>
                    <td>${transfer.status}</td>
                `;
                completedTransactionsTableBody.appendChild(tr);
            });
        }
    };


        // Load profile page
        document.addEventListener("DOMContentLoaded", function() {
            function updateProfileInfo() {
                const name = localStorage.getItem('name');
                const email = localStorage.getItem('email');
                const password = localStorage.getItem('password');
                const country = localStorage.getItem('country');

                document.getElementById('display-name').textContent = name || 'N/A';
                document.getElementById('display-email').textContent = email || 'N/A';
                document.getElementById('display-password').textContent = password || 'N/A';
                document.getElementById('display-country').textContent = country || 'N/A';
            }

        updateProfileInfo();
        });

        document.getElementById('exchange-form').style.display = 'none';
        alert('Transaction updated successfully');
    };

    // Check if on homepage or bitcoin page and load balance
    if (window.location.pathname === '/homepage.html' || window.location.pathname === '/bitcoin.html') {
        loadHomePage();
    }

    // Check if on dashboard page and load dashboard data
    if (window.location.pathname === '/dashboard.html') {
        loadDashboard();
    }

});
