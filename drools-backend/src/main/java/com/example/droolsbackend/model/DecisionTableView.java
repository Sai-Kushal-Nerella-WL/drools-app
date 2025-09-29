package com.example.droolsbackend.model;

import java.util.List;

public class DecisionTableView {
    private List<String> columnLabels;
    private List<String> templateLabels;
    private List<RuleRow> rows;

    public DecisionTableView() {}

    public DecisionTableView(List<String> columnLabels, List<String> templateLabels, List<RuleRow> rows) {
        this.columnLabels = columnLabels;
        this.templateLabels = templateLabels;
        this.rows = rows;
    }

    public List<String> getColumnLabels() {
        return columnLabels;
    }

    public void setColumnLabels(List<String> columnLabels) {
        this.columnLabels = columnLabels;
    }

    public List<String> getTemplateLabels() {
        return templateLabels;
    }

    public void setTemplateLabels(List<String> templateLabels) {
        this.templateLabels = templateLabels;
    }

    public List<RuleRow> getRows() {
        return rows;
    }

    public void setRows(List<RuleRow> rows) {
        this.rows = rows;
    }
}
