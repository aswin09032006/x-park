mergeInto(LibraryManager.library, {
    SendJsonToPage: function (jsonPtr) {
        const json = UTF8ToString(jsonPtr);
        // --- LOGGING ---
        console.log("%c[Unity->JS Bridge]", "color: #ff9900; font-weight: bold;", "Received data:", json);

        if (window.onUnityData) {
            window.onUnityData(json);
        } else {
            console.warn("[Unity->JS Bridge] window.onUnityData is not defined. Cannot forward message to React.");
        }
    },

    GetJsonFromPage: function () {
        const storedJson = window.localStorage.getItem("dataForUnity") || "{}";
        // --- LOGGING ---
        console.log("%c[JS->Unity Bridge]", "color: #ff9900; font-weight: bold;", "Sending data from localStorage:", storedJson);

        const lengthBytes = lengthBytesUTF8(storedJson) + 1;
        const stringOnWasmHeap = _malloc(lengthBytes);
        stringToUTF8(storedJson, stringOnWasmHeap, lengthBytes);
        return stringOnWasmHeap;
    }
});