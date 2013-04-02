<%@ page language="java" extends="com.drypot.app.AppJspBase" contentType="text/html; charset=UTF-8" %>

<%
	requestService.setTitle(postContext.getThread().getTitle());
	postContext.setEditLinkVisible(true);
%>

<jsp:include page="../page-begin.jsp"/>

<div id="content">

	<jsp:include page="_view.jsp"/>

	<% if (postContext.isWritable()) { %>
	<div class="cmd big-margin">
		<a href="<%= postContext.getReplyUrl() %>">Reply</a>
	</div>
	<% } %>

	<jsp:include page="_list.jsp"/>

</div>
<script>$(function(){initPostViewScroller('<%= formatTillSecond(authService.getLastVisit()) %>');});</script>

<jsp:include page="../page-end.jsp"/>
