"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up (queryInterface, Sequelize) {
		await queryInterface.changeColumn('games', 'is_active', {
			type: Sequelize.TINYINT,
			allowNull: false,
			defaultValue: 0
		});
		await queryInterface.addIndex('games', {
			fields: ['sequence_order'],
			name: 'games_sequence_order_index'
		});
		await queryInterface.addIndex('games', {
			fields: ['is_active'],
			name: 'games_is_active_index'
		});
		await queryInterface.addIndex('games', {
			fields: ['type'],
			name: 'games_type_index'
		});
	},

	async down (queryInterface, Sequelize) {
		await queryInterface.removeIndex('games', 'games_sequence_order_index');
		await queryInterface.removeIndex('games', 'games_is_active_index');
		await queryInterface.removeIndex('games', 'games_type_index');
		await queryInterface.changeColumn('games', 'is_active', {
			type: Sequelize.TINYINT,
			allowNull: false,
			defaultValue: 1
		});
	}
};
