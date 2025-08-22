"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Modify kid_students table to make kid_parent_id point to users table instead of kid_parents
     * Since kid_parents table has been dropped, we cannot migrate existing data
     * This migration assumes the data will be manually updated or the table is empty
     */

    // Note: kid_parent_id column now points to users table instead of kid_parents table
    // No structural changes needed to the column itself
    // Data migration cannot be performed since kid_parents table no longer exists

    console.log(
      "Migration note: kid_parent_id now references users table instead of kid_parents table"
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Restore original kid_parent_id values (pointing back to kid_parents table)
     * Note: This is a destructive migration since kid_parents table would be dropped
     * Cannot fully restore data in down migration
     */
    // Note: Cannot restore original relationships since kid_parents table would be dropped
    // This migration is essentially irreversible once kid_parents table is dropped
  },
};
