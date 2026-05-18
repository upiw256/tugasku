const mongoose = require('mongoose');
const { Schema, model, models } = mongoose;

const MemberSchema = new Schema({
  nis: { type: String, required: true },
  nama_lengkap: { type: String, required: true },
  kelas: { type: String, required: true },
}, { timestamps: false });

const Member = models.Member || model('Member', MemberSchema);

const UserSchema = new Schema({
  user: { type: String, required: true },
  member_id: { type: Schema.Types.ObjectId, ref: 'Member' },
}, { timestamps: false });

const User = models.User || model('User', UserSchema);

const NilaiSchema = new Schema({
  member_id: { type: Schema.Types.ObjectId, ref: 'Member' },
}, { timestamps: false });

const Nilai = models.Nilai || model('Nilai', NilaiSchema);

async function run() {
  await mongoose.connect('mongodb://localhost:27017/tugasku');
  console.log("Connected to DB");

  const allMembers = await Member.find({});
  console.log(`Checking ${allMembers.length} members...`);

  let totalDeleted = 0;
  const processedNis = new Set();

  for (const m of allMembers) {
    const trimmedNis = m.nis.trim();
    
    if (processedNis.has(trimmedNis)) continue; // Already handled this NIS group

    // Find all variations of this NIS (trimmed or with spaces)
    const variations = await Member.find({
        $or: [
            { nis: trimmedNis },
            { nis: trimmedNis + ' ' },
            { nis: ' ' + trimmedNis },
            { nis: ' ' + trimmedNis + ' ' }
        ]
    });

    if (variations.length > 1) {
        console.log(`Found ${variations.length} entries for NIS: [${trimmedNis}]`);
        
        // Priority: keep one with values
        let keptMember = null;
        for (const v of variations) {
            const hasNilai = await Nilai.exists({ member_id: v._id });
            if (hasNilai) {
                keptMember = v;
                break;
            }
        }
        
        if (!keptMember) keptMember = variations[0];

        console.log(`Keeping ID: ${keptMember._id} NIS: [${keptMember.nis}]`);

        // Delete others
        for (const v of variations) {
            if (v._id.toString() === keptMember._id.toString()) continue;

            await Member.findByIdAndDelete(v._id);
            await User.findOneAndDelete({ member_id: v._id });
            totalDeleted++;
        }

        // Fix kept member NIS (remove spaces)
        if (keptMember.nis !== trimmedNis) {
            keptMember.nis = trimmedNis;
            await keptMember.save();
        }
    } else if (m.nis !== trimmedNis) {
        // Just one entry but needs trimming
        m.nis = trimmedNis;
        try {
            await m.save();
        } catch (e) {
            console.log(`Error trimming single NIS ${m.nis}: another might exist with different case or invisible chars`);
        }
    }

    processedNis.add(trimmedNis);
  }

  console.log(`Done! Deleted ${totalDeleted} duplicates.`);
  process.exit();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
