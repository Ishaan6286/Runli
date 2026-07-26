import { convertYoutubeToEmbed } from '../utils/videoUtils';

const processVideoData = (dataList, category, subcategoryMapping = {}) => {
  return dataList.map((item, index) => {
    const { videoId, embedUrl, thumbnail } = convertYoutubeToEmbed(item.url);
    
    // Attempt to determine subcategory based on name for exercises if mapping is provided
    let subcategory = item.subcategory || "";
    if (category === "Exercise" && !subcategory) {
      for (const [subcat, exercises] of Object.entries(subcategoryMapping)) {
        if (exercises.includes(item.title)) {
          subcategory = subcat;
          break;
        }
      }
    }

    return {
      id: `${category.toLowerCase()}-${index + 1}`,
      title: item.title,
      category,
      subcategory,
      youtubeUrl: item.url,
      embedUrl,
      thumbnail,
      videoId
    };
  });
};

const exerciseRawData = [
  { title: "Bench Press (Flat)", url: "https://www.youtube.com/watch?v=hWbUlkb5Ms4", subcategory: "Chest" },
  { title: "Bench Press (Incline)", url: "https://www.youtube.com/watch?v=8iPEnn-ltC8", subcategory: "Chest" },
  { title: "Bench Press (Decline)", url: "https://www.youtube.com/watch?v=LfyQBUKR8SE", subcategory: "Chest" },
  { title: "Dumbbell Press (Flat)", url: "https://www.youtube.com/watch?v=VmB1G1K7v94", subcategory: "Chest" },
  { title: "Dumbbell Press (Incline)", url: "https://www.youtube.com/watch?v=8iPEnn-ltC8", subcategory: "Chest" },
  { title: "Dumbbell Press (Decline)", url: "https://www.youtube.com/watch?v=0G2_XV7slIg", subcategory: "Chest" },
  { title: "Push-ups", url: "https://www.youtube.com/watch?v=IODxDxX7oi4", subcategory: "Chest" },
  { title: "Cable Crossover", url: "https://www.youtube.com/watch?v=kZJZWtfNpVI", subcategory: "Chest" },
  { title: "Dips (Chest Variation)", url: "https://www.youtube.com/watch?v=2z8JmcrW-As", subcategory: "Chest" },
  { title: "Dumbbell Fly", url: "https://www.youtube.com/watch?v=eozdVDA78K0", subcategory: "Chest" },
  { title: "Pec Deck Machine", url: "https://www.youtube.com/watch?v=6JtP6juZx68", subcategory: "Chest" },
  
  { title: "Bent-Over Barbell Row", url: "https://www.youtube.com/watch?v=vT2GjY_Umpw", subcategory: "Back" },
  { title: "Dumbbell Row", url: "https://www.youtube.com/watch?v=pYcpY20QaE8", subcategory: "Back" },
  { title: "Seated Cable Row", url: "https://www.youtube.com/watch?v=GZbfZ033f74", subcategory: "Back" },
  { title: "Lat Pulldown (Wide Grip)", url: "https://www.youtube.com/watch?v=CAwf7n6Luuc", subcategory: "Back" },
  { title: "Lat Pulldown (Close Grip)", url: "https://www.youtube.com/watch?v=ImATh1ZTffc", subcategory: "Back" },
  { title: "Lat Pulldown (Reverse Grip)", url: "https://www.youtube.com/watch?v=BwPiRfNBb4g", subcategory: "Back" },
  { title: "Pull-up / Chin-up", url: "https://www.youtube.com/watch?v=eGo4IYlbE5g", subcategory: "Back" },
  { title: "T-Bar Row", url: "https://www.youtube.com/watch?v=j3Igk5nyZE4", subcategory: "Back" },
  { title: "Deadlift", url: "https://www.youtube.com/watch?v=fc4_hq7tjkU", subcategory: "Back" },
  { title: "Back Extension / Hyperextension", url: "https://www.youtube.com/watch?v=3kzAV20d_dE", subcategory: "Back" },
  
  { title: "Overhead Press (Military Press)", url: "https://www.youtube.com/watch?v=k4WoLZbonns", subcategory: "Shoulders" },
  { title: "Overhead Dumbbell Press", url: "https://www.youtube.com/watch?v=qEwKCR5JCog", subcategory: "Shoulders" },
  { title: "Dumbbell Lateral Raise", url: "https://www.youtube.com/watch?v=3VcKaXpzqRo", subcategory: "Shoulders" },
  { title: "Front Raise", url: "https://www.youtube.com/watch?v=-t7fuZ0KhDA", subcategory: "Shoulders" },
  { title: "Rear Delt Reverse Fly", url: "https://youtu.be/3t7Wewaopog", subcategory: "Shoulders" },
  { title: "Face Pull", url: "https://youtu.be/3t7Wewaopog", subcategory: "Shoulders" },
  { title: "Shrugs", url: "https://www.youtube.com/watch?v=cJRVVxmytaM", subcategory: "Shoulders" },
  
  { title: "Barbell Curl", url: "https://youtu.be/oX5tKhqChO8", subcategory: "Biceps" },
  { title: "Dumbbell Curl", url: "https://www.youtube.com/watch?v=ykJmrZ5v0Oo", subcategory: "Biceps" },
  { title: "Hammer Curl", url: "https://youtu.be/gZMzGWDPvk4", subcategory: "Biceps" },
  { title: "Preacher Curl", url: "https://youtu.be/Jorpkf6MWYA", subcategory: "Biceps" },
  { title: "Concentration Curl", url: "https://youtu.be/MDQbacitB-E", subcategory: "Biceps" },
  { title: "Cable Curl", url: "https://youtu.be/IlqxbOBGXv4", subcategory: "Biceps" },
  
  { title: "Triceps Pushdown", url: "https://youtu.be/Vwf9n6TwF0g", subcategory: "Triceps" },
  { title: "Overhead Triceps Extension", url: "https://youtu.be/38QQai2Ag9Y", subcategory: "Triceps" },
  { title: "Skull Crusher", url: "https://www.youtube.com/watch?v=d_KZxkY_0cM", subcategory: "Triceps" },
  { title: "Close-Grip Bench Press", url: "https://www.youtube.com/watch?v=gWmbjMAkoGo", subcategory: "Triceps" },
  { title: "Triceps Kickback", url: "https://youtu.be/5sdiw33JZcU", subcategory: "Triceps" },
  
  { title: "Wrist Curl", url: "https://www.youtube.com/watch?v=K1l3B2m6F9c", subcategory: "Forearms" },
  { title: "Reverse Wrist Curl", url: "https://www.youtube.com/watch?v=6gkZGJG-yps", subcategory: "Forearms" },
  { title: "Farmer's Carry", url: "https://www.youtube.com/watch?v=Fkzk_RqlYig", subcategory: "Forearms" },
  
  { title: "Barbell Back Squat", url: "https://www.youtube.com/watch?v=Dy28eq2PjcM", subcategory: "Legs (Quads)" },
  { title: "Barbell Front Squat", url: "https://www.youtube.com/watch?v=tlfGU4UxXhQ", subcategory: "Legs (Quads)" },
  { title: "Goblet Squat", url: "https://www.youtube.com/watch?v=MeIiIdhvXT4", subcategory: "Legs (Quads)" },
  { title: "Leg Press", url: "https://www.youtube.com/watch?v=IZxyjW7MPJQ", subcategory: "Legs (Quads)" },
  { title: "Leg Extension", url: "https://www.youtube.com/watch?v=YyvSfVjQeL0", subcategory: "Legs (Quads)" },
  { title: "Walking Lunge", url: "https://www.youtube.com/watch?v=wrwwXE_x-pQ", subcategory: "Legs (Quads)" },
  { title: "Reverse Lunge", url: "https://www.youtube.com/watch?v=rvqLVxYqEvo", subcategory: "Legs (Quads)" },
  { title: "Bulgarian Split Squat", url: "https://www.youtube.com/watch?v=2C-uNgKwPLE", subcategory: "Legs (Quads)" },
  
  { title: "Barbell Hip Thrust", url: "https://www.youtube.com/watch?v=LM8XHLYJoYs", subcategory: "Hamstrings & Glutes" },
  { title: "Romanian Deadlift (RDL)", url: "https://www.youtube.com/watch?v=2SHsk9AzdjA", subcategory: "Hamstrings & Glutes" },
  { title: "Stiff-Legged Deadlift", url: "https://www.youtube.com/watch?v=CN_7cz3P-1U", subcategory: "Hamstrings & Glutes" },
  { title: "Lying Leg Curl", url: "https://www.youtube.com/watch?v=1Tq3QdYUuHs", subcategory: "Hamstrings & Glutes" },
  { title: "Seated Leg Curl", url: "https://www.youtube.com/watch?v=ELOCsoDSmrg", subcategory: "Hamstrings & Glutes" },
  { title: "Glute-Ham Raise", url: "https://www.youtube.com/watch?v=QG3TAwfo9iQ", subcategory: "Hamstrings & Glutes" },
  { title: "Cable Pull-Through", url: "https://www.youtube.com/watch?v=hy3W-3HPMWg", subcategory: "Hamstrings & Glutes" },
  
  { title: "Standing Calf Raise", url: "https://www.youtube.com/watch?v=-M4-G8p8fmc", subcategory: "Calves" },
  { title: "Seated Calf Raise", url: "https://www.youtube.com/watch?v=JbyjNymZOt0", subcategory: "Calves" },
  { title: "Leg Press Calf Raise", url: "https://www.youtube.com/watch?v=YMmgqO8Jo-k", subcategory: "Calves" },
  
  { title: "Crunch", url: "https://www.youtube.com/watch?v=Xyd_fa5zoEU", subcategory: "Core / Abs" },
  { title: "Cable Crunch", url: "https://www.youtube.com/watch?v=AV5PmZJIrrw", subcategory: "Core / Abs" },
  { title: "Hanging Leg Raise", url: "https://www.youtube.com/watch?v=Pr1ieGZ5atk", subcategory: "Core / Abs" },
  { title: "Reverse Crunch", url: "https://www.youtube.com/watch?v=JB2oyawG9KI", subcategory: "Core / Abs" },
  { title: "Russian Twist", url: "https://www.youtube.com/watch?v=wkD8rjkodUI", subcategory: "Core / Abs" },
  { title: "Plank", url: "https://www.youtube.com/watch?v=ASdvN_XEl_c", subcategory: "Core / Abs" },
  { title: "Side Plank", url: "https://www.youtube.com/watch?v=K2VljzCC16g", subcategory: "Core / Abs" },
  { title: "Ab Wheel Rollout", url: "https://www.youtube.com/watch?v=A3uK5TPzHq8", subcategory: "Core / Abs" },
  { title: "Pallof Press", url: "https://www.youtube.com/watch?v=5_8d7fJY1Y4", subcategory: "Core / Abs" },
  { title: "Dead Bug", url: "https://www.youtube.com/watch?v=4XLEnwUr8hw", subcategory: "Core / Abs" }
];

const recipeRawData = [
  { title: "One Pan Lemon Garlic Salmon", url: "https://www.youtube.com/watch?v=2uYoqclu6so" },
  { title: "Healthy Chicken Parmesan", url: "https://www.youtube.com/watch?v=VgGq0c4Q4n4" },
  { title: "Steak & Sweet Potato Hash", url: "https://www.youtube.com/watch?v=8L4M0Gx6n2Q" },
  { title: "Crispy Chicken Wrap", url: "https://www.youtube.com/watch?v=hSYtqP9Rgg8" },
  { title: "Tuna Salad Protein Bowl", url: "https://www.youtube.com/watch?v=YR0d8iM0q9E" },
  { title: "Turkey Meatball Meal Prep", url: "https://www.youtube.com/watch?v=MXJyH4vdkLk" }
];

const fitnessRawData = [
  { title: "The New Science of Muscle Hypertrophy", url: "https://www.youtube.com/watch?v=lu_BObG6dj8" },
  { title: "How to Lose Fat and Keep It Off", url: "https://www.youtube.com/watch?v=slXxO2zJXUI" },
  { title: "Supplements That Actually Work", url: "https://www.youtube.com/watch?v=IR5jW9iNNiw" }
];

export const exerciseVideos = processVideoData(exerciseRawData, "Exercise");
export const recipeVideos = processVideoData(recipeRawData, "Recipe");
export const fitnessVideos = processVideoData(fitnessRawData, "General Fitness");

export const runliVideos = [
  ...exerciseVideos,
  ...recipeVideos,
  ...fitnessVideos
];
