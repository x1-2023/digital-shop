#!/usr/bin/env node

/**
 * Migrate old orders to create ProductLineItems
 *
 * This script finds all PAID orders that don't have ProductLineItems
 * and creates them from the ProductLog content
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateOldOrders() {
  console.log('🔄 Starting migration of old orders to ProductLineItem system...\n');

  try {
    // Find all paid orders
    const paidOrders = await prisma.order.findMany({
      where: {
        status: 'PAID',
      },
      include: {
        productLogs: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log(`📊 Found ${paidOrders.length} paid orders\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const order of paidOrders) {
      try {
        // Check if this order already has ProductLineItems
        const existingLines = await prisma.productLineItem.findMany({
          where: { orderId: order.id },
        });

        if (existingLines.length > 0) {
          console.log(`⏭️  Skipping order ${order.id.slice(0, 10)} (already has ${existingLines.length} product lines)`);
          skippedCount++;
          continue;
        }

        // Process each ProductLog
        let createdLines = 0;
        for (const log of order.productLogs) {
          if (!log.content) continue;

          // Find matching order item
          const orderItem = order.orderItems.find(item => item.productId === log.productId);
          if (!orderItem) continue;

          // Parse content to extract individual lines
          const content = log.content;
          const lines = content.split('\n');
          const individualLines = [];

          for (const line of lines) {
            const trimmed = line.trim();
            // Extract content lines (numbered format like "1. content" or just plain content)
            const match = trimmed.match(/^\d+\.\s+(.+)$/);
            if (match) {
              individualLines.push(match[1]);
            } else if (trimmed &&
                       !trimmed.startsWith('===') &&
                       !trimmed.startsWith('Sản phẩm:') &&
                       !trimmed.startsWith('Số lượng:') &&
                       !trimmed.startsWith('LICENSE KEYS') &&
                       !trimmed.startsWith('NỘI DUNG') &&
                       !trimmed.startsWith('⚠️')) {
              individualLines.push(trimmed);
            }
          }

          // Create ProductLineItem for each line
          for (const lineContent of individualLines) {
            await prisma.productLineItem.create({
              data: {
                productLogId: log.id,
                orderId: order.id,
                productName: orderItem.product.name,
                content: lineContent,
                priceVnd: orderItem.priceVnd,
                status: 'NORMAL',
                errorReported: false,
              },
            });
            createdLines++;
          }
        }

        if (createdLines > 0) {
          console.log(`✅ Migrated order ${order.id.slice(0, 10)} - created ${createdLines} product lines`);
          migratedCount++;
        } else {
          console.log(`⚠️  Order ${order.id.slice(0, 10)} has no content to migrate`);
        }

      } catch (error) {
        console.error(`❌ Error migrating order ${order.id.slice(0, 10)}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount} orders`);
    console.log(`   ⏭️  Skipped: ${skippedCount} orders (already migrated)`);
    console.log(`   ❌ Errors: ${errorCount} orders`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateOldOrders()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
