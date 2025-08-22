module.exports = {
  Sequelize: jest.fn().mockImplementation(() => {
    return {
      define: jest.fn(),
      sync: jest.fn().mockResolvedValue(true),
      authenticate: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true),
      query: jest.fn().mockResolvedValue([]),
      transaction: jest.fn().mockImplementation((callback) => {
        return callback({
          commit: jest.fn(),
          rollback: jest.fn(),
        });
      }),
    };
  }),
  DataTypes: {
    STRING: 'string',
    INTEGER: 'integer',
    BOOLEAN: 'boolean',
  },
};