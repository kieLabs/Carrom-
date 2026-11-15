# CARROM KING – GAMERKIE EDITION: GitHub Pages par upload kaise karein

## 1. ZIP extract karein

1. `CARROM-KING-GAMERKIE-EDITION.zip` ko phone ya computer par download karein.
2. File Manager se ZIP ko **Extract** karein.
3. Extract hue folder ke andar `index.html`, `css`, `js` aur `assets` dikhne chahiye.

**Zaroori:** GitHub repository ke root mein `index.html` hona chahiye. ZIP ko repository mein sirf ZIP file ke roop mein upload mat karein aur poora folder ek extra folder ke andar mat rakhein.

## 2. GitHub repository banayein

1. GitHub par login karein.
2. `New repository` par tap/click karein.
3. Repository name rakhein: `Carrom-King-GamerKie`.
4. Repository ko **Public** rakhein.
5. `Create repository` karein.

## 3. Project files upload karein

1. Nayi repository kholein.
2. `Add file` → `Upload files` chunein.
3. Extract kiye hue project folder ke **andar ke saare files aur folders** select karein.
4. Upload complete hone par `Commit changes` karein.
5. Repository ke main page par check karein ki `index.html` seedha dikh raha hai. Saath mein `css`, `js` aur `assets` folders bhi hone chahiye.

## 4. GitHub Pages ON karein

1. Repository mein `Settings` kholein.
2. Left menu mein `Pages` kholein.
3. `Build and deployment` ke andar `Deploy from a branch` select karein.
4. Branch `main` select karein.
5. Folder `/ (root)` select karein.
6. `Save` dabayein.
7. Pages publish hone ke baad GitHub wahi page par website ka URL dikhayega.

Agar GitHub username `kielabs` hai aur repository ka naam `Carrom-King-GamerKie` hai, to expected URL:

`https://kielabs.github.io/Carrom-King-GamerKie/`

Yeh URL tabhi chalega jab repository aapke account mein isi naam se ban chuki ho aur Pages deploy ho gaya ho.

## 5. Blogger mein game lagayein

1. Blogger mein post kholein ya nayi post banayein.
2. Editor ko `HTML view` mein badlein.
3. `blogger-iframe.html` file ke andar ka code copy karein.
4. Iframe ke `src` mein apna published GitHub Pages URL rakhein.
5. Post publish karke phone par check karein.

## Mobile par game kaise khelein

- Game screen par board ko landscape mode mein khelna behtar hai.
- Striker ko baseline par left/right move karein.
- Striker par touch karke peeche drag karein; chhodte hi shot lagega.
- Drag jitna lamba hoga, shot power utni zyada hogi.
- AI, 2 Player, 2 vs 2 aur Practice mode internet ke bina bhi local device par khele ja sakte hain, jab page load ho chuka ho.

## Zaroori baat

Online Multiplayer abhi active nahi hai. Uske liye alag backend, matchmaking aur real-time server chahiye. Is package mein local/offline modes, AI, game rules, physics aur local progress save diye gaye hain. Kisi online opponent ke saath real match ka daawa nahi kiya gaya hai.
