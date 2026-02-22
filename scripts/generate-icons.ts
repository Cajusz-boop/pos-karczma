import sharp from "sharp";
import path from "path";

const logoPath = "C:\\Users\\hp\\.cursor\\projects\\c-pos-karczma\\assets\\c__Users_hp_AppData_Roaming_Cursor_User_workspaceStorage_b32b6503fd56150e5566686f82a637a1_images_Logo_pion_brazowe_tlo-01-61439622-9c88-48c0-8529-70255ad1f40e.png";

const publicDir = path.join(process.cwd(), "public");

async function generateIcons() {
  console.log("Loading logo from:", logoPath);

  const sizes = [192, 512];

  for (const size of sizes) {
    const outputPath = path.join(publicDir, `icon-${size}.png`);
    
    await sharp(logoPath)
      .resize(size, size, {
        fit: "contain",
        background: { r: 137, g: 90, b: 58, alpha: 1 },
      })
      .png()
      .toFile(outputPath);

    console.log(`Generated: icon-${size}.png`);
  }

  console.log("Done! Icons generated successfully.");
}

generateIcons().catch(console.error);
