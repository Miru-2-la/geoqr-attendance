export function clear(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

export function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
        if (key === "className") {
            node.className = value;
        } else if (key === "textContent") {
            node.textContent = value;
        } else if (key === "innerHTML") {
            throw new Error("Do not use innerHTML for dynamic content. Use textContent.");
        } else if (key.startsWith("on") && typeof value === "function") {
            node.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            node.setAttribute(key, value);
        }
    }

    for (const child of [].concat(children)) {
        if (child == null) continue;
        node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }

    return node;
}

export function card(title, bodyChildren = [], subtitle = "") {
    const children = [];
    if (title) children.push(el("h3", { textContent: title }));
    if (subtitle) children.push(el("p", { className: "muted small", textContent: subtitle }));
    children.push(...[].concat(bodyChildren));
    return el("div", { className: "card" }, children);
}

export function statCard(label, value, hint = "") {
    const children = [
        el("div", { className: "muted small", textContent: label }),
        el("div", { className: "stat-value", textContent: String(value) }),
    ];
    if (hint) children.push(el("div", { className: "muted small", textContent: hint }));
    return el("div", { className: "stat-card" }, children);
}

export function loading(text = "Loading...") {
    return el("div", { className: "empty-state" }, [
        el("span", { className: "loader dark" }),
        document.createTextNode(text),
    ]);
}

export function emptyState(text = "No data found.") {
    return el("div", { className: "empty-state" }, text);
}

export function errorState(text = "Something went wrong.") {
    return el("div", { className: "error-state" }, text);
}

export function badge(text, type = "blue") {
    return el("span", { className: `badge ${type}`, textContent: text });
}

export function table(headers, rows) {
    const thead = el("thead", {}, [
        el("tr", {}, headers.map((h) => el("th", { textContent: h })))
    ]);

    const tbody = el("tbody", {}, rows.map((row) => {
        return el("tr", {}, row.map((cell) => {
            if (cell instanceof Node) return el("td", {}, [cell]);
            return el("td", { textContent: cell == null ? "" : String(cell) });
        }));
    }));

    return el("div", { className: "table-wrap" }, [
        el("table", {}, [thead, tbody]),
    ]);
}