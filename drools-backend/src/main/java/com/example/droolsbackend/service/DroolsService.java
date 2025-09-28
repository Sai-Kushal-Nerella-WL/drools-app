package com.example.droolsbackend.service;

import com.example.droolsbackend.model.DecisionTableView;
import com.example.droolsbackend.model.RuleRow;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DroolsService {

    public boolean validateDroolsDecisionTableStructure(DecisionTableView tableView) {
        if (tableView == null || tableView.getColumnLabels() == null) {
            return false;
        }

        boolean hasCondition = false;
        boolean hasAction = false;
        boolean hasName = false;

        for (String columnLabel : tableView.getColumnLabels()) {
            if ("NAME".equals(columnLabel)) {
                hasName = true;
            } else if (columnLabel != null && columnLabel.startsWith("CONDITION")) {
                hasCondition = true;
            } else if (columnLabel != null && columnLabel.startsWith("ACTION")) {
                hasAction = true;
            }
        }

        return hasName && hasCondition && hasAction;
    }

    public String generateDroolsColumnName(String columnType, List<String> existingColumns) {
        if ("CONDITION".equals(columnType)) {
            int conditionCount = 0;
            for (String column : existingColumns) {
                if (column != null && column.startsWith("CONDITION")) {
                    conditionCount++;
                }
            }
            return conditionCount == 0 ? "CONDITION" : "CONDITION" + (conditionCount + 1);
        } else if ("ACTION".equals(columnType)) {
            int actionCount = 0;
            for (String column : existingColumns) {
                if (column != null && column.startsWith("ACTION")) {
                    actionCount++;
                }
            }
            return actionCount == 0 ? "ACTION" : "ACTION" + (actionCount + 1);
        }
        return columnType;
    }

    public String getDefaultTemplateValue(String columnType) {
        if ("CONDITION".equals(columnType)) {
            return "customer.getAge() >= $param";
        } else if ("ACTION".equals(columnType)) {
            return "customer.setDiscount($param);";
        }
        return "";
    }

    public Map<String, Object> executeRules(DecisionTableView tableView, Map<String, Object> inputData) {
        Map<String, Object> results = new HashMap<>();
        results.put("executed", true);
        results.put("message", "Drools rule execution not yet implemented - placeholder for future integration");
        results.put("inputData", inputData);
        return results;
    }
}
