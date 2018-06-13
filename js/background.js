chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
	// 显示小图标
	chrome.pageAction.show(tabId);
});

chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
	if(request.type == 'img'){ // 获取图片二进制内容
		getImgForXhr(request.url, function(res){
			sendResponse(res);
		});
	}
});


function getImgForXhr(url, callback){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.responseType = "blob";
	xhr.onreadystatechange = function () {
		if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200){
			callback(URL.createObjectURL(xhr.response));
			// callback(xhr.responseText);
		}
		xhr.onreadystatechange = null
	}
	xhr.send();
}
