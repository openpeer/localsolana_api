// controllers/lists/index.js
const { createList } = require('./create');
const { getAllLists, getList, getListsCount } = require('./read');
const { updateList, updateListStatus } = require('./update');
const { deleteList } = require('./delete');
const { fetchListForParticularUser, fetchMyAds } = require('./user-lists');
const { testListController } = require('./test');

module.exports = {
  createList,
  getAllLists,
  getList,
  getListsCount,
  updateList,
  updateListStatus,
  deleteList,
  testListController,
  fetchListForParticularUser,
  fetchMyAds
};