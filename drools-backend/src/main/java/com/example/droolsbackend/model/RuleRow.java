package com.example.droolsbackend.model;

import java.util.List;

public class RuleRow {
    private String name;
    private List<Object> values;

    public RuleRow() {}

    public RuleRow(String name, List<Object> values) {
        this.name = name;
        this.values = values;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<Object> getValues() {
        return values;
    }

    public void setValues(List<Object> values) {
        this.values = values;
    }
}
