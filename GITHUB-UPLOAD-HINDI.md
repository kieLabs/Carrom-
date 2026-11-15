# GitHub Pages पर Carrom Pool Game Upload करें

## 1. ZIP खोलें

1. `CARROM-POOL-GAMERKIE-COMPLETE.zip` डाउनलोड करके Extract करें।
2. Extract हुए folder में `index.html` मुख्य game file है।
3. GitHub पर upload करते समय `index.html` को repository के **root** में रखें; किसी extra folder के अंदर न रखें।

## 2. GitHub Repository बनाएं

1. GitHub खोलें और **New repository** चुनें।
2. Repository name रखें: `Carrom-Pool-GamerKie` (या अपना पसंदीदा नाम)।
3. Repository को **Public** रखें और **Create repository** दबाएं।
4. **Add file → Upload files** पर क्लिक करें।
5. Extract किए folder के अंदर की files/folders चुनें: `index.html`, `README.md`, `GITHUB-UPLOAD-HINDI.md`, `blogger-iframe.html` और `tests` folder।
6. नीचे **Commit changes** दबाएं।

## 3. GitHub Pages चालू करें

1. Repository में **Settings → Pages** खोलें।
2. **Build and deployment** के नीचे Source: **Deploy from a branch** चुनें।
3. Branch: **main** और Folder: **/(root)** चुनें।
4. **Save** दबाएं।
5. Pages section में दिखने वाला published URL खोलें। आमतौर पर URL का format यह होगा:

`https://YOUR-GITHUB-USERNAME.github.io/Carrom-Pool-GamerKie/`

पहली बार publish होने में कुछ मिनट लग सकते हैं। अगर 404 आए तो Pages status पूरा होने के बाद refresh करें और देखें कि `index.html` repository के root में है।

## 4. Blogger में Game लगाएं

1. `blogger-iframe.html` खोलें और पूरा code copy करें।
2. `src` में अपनी असली GitHub Pages URL डालें।
3. Blogger Post बनाएं → HTML view खोलें → code paste करें → Publish करें।

## ध्यान दें

- इस game के लिए `assets` folder, image URL, audio URL, API, Firebase या VPS की जरूरत नहीं है। Board, pieces और sound code से बनते हैं।
- `index.html` को root में रखना जरूरी है। अगर इसे `game/index.html` में रखेंगे तो Pages URL भी अलग होगा।
- यह offline AI और उसी device पर 2-player game है। Online multiplayer इसमें शामिल नहीं है।
