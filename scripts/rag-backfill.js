// scripts/rag-backfill.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../server/models/User.js';
import DailyProgress from '../server/models/DailyProgress.js';
import ExerciseHistory from '../server/models/ExerciseHistory.js';
import FoodLog from '../server/models/FoodLog.js';

dotenv.config({ path: '.env' });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const backfill = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({}).select('-password');
    console.log(`Found ${users.length} users to backfill.`);

    for (const user of users) {
      console.log(`\nBackfilling for user: ${user.name} (${user._id})`);
      
      // 1. Ingest Profile
      const goalMap = { lose_weight: 'fat loss', gain_muscle: 'muscle gain', maintain: 'maintaining weight' };
      const goalText = goalMap[user.goal] || user.goal || 'general fitness';
      const parts = [`User's fitness goal is ${goalText}.`];
      if (user.weight) parts.push(`Current weight: ${user.weight}kg.`);
      if (user.targetWeight) parts.push(`Target weight: ${user.targetWeight}kg.`);
      if (user.experience) parts.push(`Experience level: ${user.experience}.`);
      if (user.dietPreference) parts.push(`Diet preference: ${user.dietPreference}.`);
      
      try {
          await fetch(`${AI_SERVICE_URL}/rag/ingest`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  user_id: user._id.toString(),
                  source_type: 'fitness_goal',
                  source_id: 'profile',
                  memory_text: parts.join(' '),
                  metadata: { goal: user.goal || '' }
              })
          });
          console.log(` - Profile ingested`);
      } catch (e) {
          console.error(` - Profile ingest failed: ${e.message}`);
      }
      
      await sleep(100);

      // 2. Ingest Daily Progress (last 14 days to avoid overloading)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const progressLogs = await DailyProgress.find({ userId: user._id, date: { $gte: twoWeeksAgo } });
      let pCount = 0;
      for (const p of progressLogs) {
        const dateStr = p.date.toISOString().slice(0, 10);
        const pParts = [`On ${dateStr}: Gym: ${p.wentToGym ? 'Yes' : 'No'}`];
        if (p.caloriesConsumed) pParts.push(`Calories: ${p.caloriesConsumed}`);
        if (p.proteinIntake) pParts.push(`Protein: ${p.proteinIntake}g`);
        
        try {
            await fetch(`${AI_SERVICE_URL}/rag/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user._id.toString(),
                    source_type: 'daily_progress',
                    source_id: dateStr,
                    memory_text: pParts.join(' | '),
                    metadata: { date: dateStr, gym: p.wentToGym || false }
                })
            });
            pCount++;
        } catch (e) {}
        await sleep(50); // Be gentle to python service
      }
      console.log(` - Progress logs ingested: ${pCount}`);
      
      // 3. Ingest Exercise History (last 14 days)
      const exercises = await ExerciseHistory.find({ 'user.userId': user._id, date: { $gte: twoWeeksAgo } });
      let eCount = 0;
      for (const ex of exercises) {
          const dateStr = ex.date.toISOString().slice(0, 10);
          try {
              await fetch(`${AI_SERVICE_URL}/rag/ingest`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      user_id: user._id.toString(),
                      source_type: 'exercise',
                      source_id: ex._id.toString(),
                      memory_text: `On ${dateStr}, performed ${ex.exerciseName}: ${ex.reps} reps.`,
                      metadata: { date: dateStr, exercise: ex.exerciseName }
                  })
              });
              eCount++;
          } catch (e) {}
          await sleep(50);
      }
      console.log(` - Exercises ingested: ${eCount}`);

      // 4. Ingest Food Logs (last 14 days)
      const foodLogs = await FoodLog.find({ userId: user._id, date: { $gte: twoWeeksAgo } });
      let fCount = 0;
      for (const f of foodLogs) {
          const dateStr = f.date.toISOString().slice(0, 10);
          try {
              await fetch(`${AI_SERVICE_URL}/rag/ingest`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      user_id: user._id.toString(),
                      source_type: 'nutrition',
                      source_id: f._id.toString(),
                      memory_text: `On ${dateStr}, nutrition log: ${f.totalCalories || 0} kcal total, ${f.totalProtein || 0}g protein.`,
                      metadata: { date: dateStr }
                  })
              });
              fCount++;
          } catch (e) {}
          await sleep(50);
      }
      console.log(` - Food logs ingested: ${fCount}`);
      
      console.log(`Done with ${user.name}`);
    }

    console.log('\nBackfill completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exit(1);
  }
};

backfill();
