<%@ page import="com.drypot.app.search.SearchParam" %>
<%@ page import="com.drypot.app.search.SearchResult" %>
<%@ page import="com.drypot.app.search.Searcher" %>
<%@ page import="com.drypot.app.search.SearchService" %>
<%@ page language="java" extends="com.drypot.app.AppJspBase" contentType="text/html; charset=UTF-8" %>

<%
	SearchParam param = searchContext.getParam();
	Searcher searcher = searchContext.getSearcher();
%>

<jsp:include page="../page-begin.jsp"/>

<div id="content">
	<div id="page-title">Search</div>
	<form class="search" action="/search" method="get">
		<input id="query" class="search-tb" type="text" name="q" value="<%= encode(param.getQuery()) %>" maxlength="512"/>
		<input class="submit" type="submit" value="Search"/>
	</form>
	<% if (searcher.hasNoQuery()) { %>

	<% } else { %>
		<% if (searcher.hasNoResult()) { %>
			<div class="searches">
				<div class="no-result">
					<div>검색 결과가 없습니다</div>
				</div>
			</div>
		<% } else { %>
			<div class="searches">
				<% for (SearchResult result : searcher.getList()) { %>
					<%
						if (!categoryService.isReadable(result.getCategoryId())) {
							continue;
						}
					%>
					<div class="post">
						<div class="title">
							<a href="<%= searchContext.getThreadViewUrl(result) %>"><%= encode(result.getTitle()) %></a>
						</div>
						<div class="info">
							<span class="u"><%= encode(result.getUserName()) %></span>
							<span class="d"><%= formatTillSecond(result.getCdate()) %></span>
						</div>
						<div class="text">
							<%= encode(result.getText()) %>
						</div>
					</div>
				<% } %>
			</div>
			<div class="pager box-a">
			<%= searchContext.getSearchResultPagerHtml() %>
			</div>
		<% } %>
	<% } %>
	<script>$(function(){$('#query').focus();});</script>
</div>

<jsp:include page="../page-end.jsp"/>
