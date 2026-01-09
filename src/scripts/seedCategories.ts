import 'tsconfig-paths/register';
import db from '../config/dbConfig';
import { categories } from '../db/tables';

// These UUIDs will be used consistently between backend and frontend
const CATEGORY_DATA = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567801',
    categoryName: 'Cleaning',
    description: 'Home and office cleaning services',
    iconUrl: 'spray-bottle',
    displayOrder: 1,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567802',
    categoryName: 'Handy Person',
    description: 'General handyman services',
    iconUrl: 'tools',
    displayOrder: 2,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567803',
    categoryName: 'Assembly',
    description: 'Furniture and equipment assembly',
    iconUrl: 'desk',
    displayOrder: 3,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567804',
    categoryName: 'Transport & Removals',
    description: 'Moving and transportation services',
    iconUrl: 'truck',
    displayOrder: 4,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567805',
    categoryName: 'Repairs',
    description: 'General repair services',
    iconUrl: 'bandage',
    displayOrder: 5,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567806',
    categoryName: 'Painting',
    description: 'Interior and exterior painting',
    iconUrl: 'format-paint',
    displayOrder: 6,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567807',
    categoryName: 'Electrical',
    description: 'Electrical work and repairs',
    iconUrl: 'flash',
    displayOrder: 7,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567808',
    categoryName: 'Plumbing',
    description: 'Plumbing services and repairs',
    iconUrl: 'pipe',
    displayOrder: 8,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567809',
    categoryName: 'Gardening & Plant Care',
    description: 'Garden maintenance and plant care',
    iconUrl: 'flower',
    displayOrder: 9,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567810',
    categoryName: 'Shopping',
    description: 'Personal shopping assistance',
    iconUrl: 'cart',
    displayOrder: 10,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567811',
    categoryName: 'Delivery',
    description: 'Delivery and courier services',
    iconUrl: 'package-variant',
    displayOrder: 11,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567812',
    categoryName: 'Packing & Lifting',
    description: 'Packing and heavy lifting help',
    iconUrl: 'archive-arrow-up',
    displayOrder: 12,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567813',
    categoryName: 'Errands',
    description: 'Running errands and tasks',
    iconUrl: 'run-fast',
    displayOrder: 13,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567814',
    categoryName: 'Ironing & Alteration',
    description: 'Clothes ironing and alterations',
    iconUrl: 'tshirt-crew',
    displayOrder: 14,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567815',
    categoryName: 'Pet Care',
    description: 'Pet sitting and care services',
    iconUrl: 'paw',
    displayOrder: 15,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567816',
    categoryName: 'Translation',
    description: 'Language translation services',
    iconUrl: 'translate',
    displayOrder: 16,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567817',
    categoryName: 'Tech & Gadgets',
    description: 'Tech support and gadget help',
    iconUrl: 'laptop',
    displayOrder: 17,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567818',
    categoryName: 'Tutoring',
    description: 'Educational tutoring services',
    iconUrl: 'school',
    displayOrder: 18,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567819',
    categoryName: 'Photography',
    description: 'Photography and videography',
    iconUrl: 'camera',
    displayOrder: 19,
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567820',
    categoryName: 'Events',
    description: 'Event planning and assistance',
    iconUrl: 'party-popper',
    displayOrder: 20,
  },
];

async function seedCategories() {
  console.log('Seeding categories...');

  try {
    for (const category of CATEGORY_DATA) {
      await db
        .insert(categories)
        .values(category)
        .onConflictDoNothing({ target: categories.id });
    }
    console.log('Categories seeded successfully!');
    console.log(`Total categories: ${CATEGORY_DATA.length}`);
  } catch (error) {
    console.error('Error seeding categories:', error);
    throw error;
  }
}

// Run if called directly
seedCategories()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });

export { CATEGORY_DATA, seedCategories };
