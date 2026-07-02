import "dotenv/config";
import mongoose from "mongoose";
import dbConnect from "../config/dbConnect";
import { Cycle } from "../model/cycle";

const generateCycleCode = async (): Promise<string> => {
  const chars = "0123456789";
  let code = "";
  let exists = true;

  while (exists) {
    const suffix = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");

    code = `SMQ${suffix}`;
    exists = Boolean(await Cycle.findOne({ cycleCode: code }));
  }

  return code;
};

async function backfillCycleCodes() {
  await dbConnect();

  const cycles = await Cycle.find({
    $or: [
      { cycleCode: { $exists: false } },
      { cycleCode: "" },
      { cycleCode: null },
    ],
  });

  console.log(`Found ${cycles.length} cycles missing a cycle code.`);

  for (const cycle of cycles) {
    const code = await generateCycleCode();
    cycle.cycleCode = code;
    await cycle.save();
    console.log(`Updated cycle ${cycle._id} -> ${code}`);
  }

  console.log("Backfill completed.");
  await mongoose.disconnect();
}

backfillCycleCodes().catch((err) => {
  console.error(err);
  process.exit(1);
});