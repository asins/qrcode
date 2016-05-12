chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
	// 显示小图标
	chrome.pageAction.show(tabId);
});
