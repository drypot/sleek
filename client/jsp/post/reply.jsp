<%@ page language="java" extends="com.drypot.app.AppJspBase" contentType="text/html; charset=UTF-8" %>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form" %>

<jsp:include page="../page-begin.jsp"/>

<div id="content">
	<jsp:include page="_view.jsp"/>
	<form:form commandName="postForm" enctype="multipart/form-data">
		<div class="input"><form:errors path="*" cssClass="error-summary"/></div>

		<div class="label"><form:label path="post.userName" cssErrorClass="error">필명</form:label></div>
		<div class="input"><form:input path="post.userName" cssClass="tb" maxlength="32"/></div>

		<div class="label"><form:label path="post.text" cssErrorClass="error">본문</form:label></div>
		<div class="input"><form:textarea path="post.text" cols="48" rows="16"/></div>

		<div class="input"><div id="file"></div>
		<a id="addFile" href="">[ + ]</a></div>

		<div class="submit"><input class="submit" type="submit" value="Submit"/></div>
	</form:form>
	<script>$(function(){initPostForm();});</script>
</div>

<jsp:include page="../page-end.jsp"/>
