<%@ page import="com.drypot.app.post.persist.Post" %>
<%@ page language="java" extends="com.drypot.app.AppJspBase" contentType="text/html; charset=UTF-8" %>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form" %>

<%
	Post post = postContext.getPost();
	String title = "수정";
	requestService.setTitle(title);
	pageContext.setAttribute("categoryList", categoryService.getWritableCategoryList());
%>

<jsp:include page="../page-begin.jsp"/>

<div id="content">
	<div id="page-title"><%= encode(title) %></div>
	<form:form commandName="postForm" enctype="multipart/form-data">
		<div class="input"><form:errors path="*" cssClass="error-summary"/></div>

		<% if (postContext.isFirstPost()) { %>
			<div class="label">분류</div>
			<div class="input"><form:select path="thread.categoryId"  items="${categoryList}" itemLabel="name" itemValue="id"/></div>
		<% } %>

		<div class="label"><form:label path="post.userName" cssErrorClass="error">필명</form:label></div>
		<div class="input"><form:input path="post.userName" cssClass="tb" maxlength="32"/></div>

		<% if (postContext.isFirstPost()) { %>
			<div class="label"><form:label path="thread.title" cssErrorClass="error">제목</form:label></div>
			<div class="input"><form:input path="thread.title" cssClass="tb" maxlength="128"/></div>
		<% } %>

		<div class="label"><form:label path="post.text" cssErrorClass="error">본문</form:label></div>
		<div class="input"><form:textarea path="post.text" cols="48" rows="16"/></div>

		<div class="input"><div id="file"></div>
		<a id="addFile" href="../post-form">[ + ]</a></div>

		<% if (post.hasFile()) { %>
			<div class="label">삭제할 파일</div>
			<div class="input">
				<form:checkboxes path="delFileNameList" items="${postForm.post.fileNameList}" delimiter="<br>"/>
			</div>
		<% } %>

		<% if (authService.isAdmin()) { %>
			<div class="label">기타<div>
			<div class="input"><form:checkbox path="post.visible" label="Visible"/></div>
		<% } %>
		<div class="submit"><input class="submit" type="submit" value="Submit"/></div>
	</form:form>
	<script>$(function(){initPostForm();});</script>
</div>

<jsp:include page="../page-end.jsp"/>
