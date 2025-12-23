/* eslint-disable */
const fs = require('fs');
const path = require('path');

const filesToCopy = [
    {
        src: "C:\\Users\\Amit.G\\.gemini\\antigravity\\brain\\45700149-f9ec-4618-a83e-20a1baa18006\\uploaded_image_1765741681198.jpg",
        dest: "d:\\Work_Dir\\Projects\\poster_mysore\\frontend\\public\\assets\\scale-reference.jpg"
    },
    {
        src: "C:\\Users\\Amit.G\\.gemini\\antigravity\\brain\\45700149-f9ec-4618-a83e-20a1baa18006\\uploaded_image_1765742549392.png",
        dest: "d:\\Work_Dir\\Projects\\poster_mysore\\frontend\\public\\logo-white.png"
    }
];

filesToCopy.forEach(file => {
   try {
       if (fs.existsSync(file.src)) {
           fs.copyFileSync(file.src, file.dest);
           console.log(`Successfully copied: ${file.dest}`);
       } else {
           console.error(`Source not found: ${file.src}`);
       }
   } catch (err) {
       console.error(`Error copying to ${file.dest}:`, err);
   }
});
