var _ = require('underscore');
var _should = require('should');
var _bcrypt = require('bcrypt');

var _lang = require('./lang');
var _config = require("./config");

var fileServerUrl;
var fileServerRoot;

_lang.addInit(function (callback) {
	fileServerUrl = _config.fileServerUrl;
	fileServerRoot = _config.fileServerRoot;
	logger.info("file server root: " + fileServerRoot);
	callback();
});


public void savePostFile(Post post, List<MultipartFile> multipartFiles) {
	if (multipartFiles == null) return;
	int postId = post.getId();
	for (MultipartFile multipartFile : multipartFiles) {
		if (multipartFile.isEmpty()) continue;
		String dir = fileServerRootDir + "/post/" + (postId / 10000) + "/" + postId;
		String safeFileName = MultipartFileUtil.getSafeFileName(multipartFile);
		MultipartFileUtil.save(multipartFile, dir, safeFileName);
		post.addFileName(safeFileName);
	}
}

public void deletePostFile(Post post, String[] deleteFiles) {
	if (deleteFiles == null) return;
	int postId = post.getId();
	for (String fileName0 : deleteFiles) {
		String fileName = new File(fileName0).getName();
		String path = fileServerRootDir + "/post/" + (postId / 10000) + "/" + postId + "/" + fileName;
		new File(path).delete();
		post.removeFileName(fileName);
	}
}

public String getPostFileUrl(Post post, String fileName) {
	int postId = post.getId();
	String path = "/post/" + (postId / 10000) + "/" + postId + "/" + fileName;
	return fileServerUrl + path;
}