package com.example.droolsbackend.controller;

import com.example.droolsbackend.model.DecisionTableView;
import com.example.droolsbackend.service.ExcelService;
import com.example.droolsbackend.service.DroolsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sheets")
@CrossOrigin(origins = "*")
public class SheetsController {

    @Autowired
    private ExcelService excelService;
    
    @Autowired
    private DroolsService droolsService;

    @GetMapping
    public ResponseEntity<List<String>> listSheets() {
        try {
            List<String> files = excelService.listExcelFiles();
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/open")
    public ResponseEntity<DecisionTableView> openSheet(@RequestBody Map<String, String> request) {
        try {
            String fileName = request.get("fileName");
            if (fileName == null || fileName.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            DecisionTableView view = excelService.readDecisionTable(fileName);
            return ResponseEntity.ok(view);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/save")
    public ResponseEntity<Map<String, String>> saveSheet(@RequestBody Map<String, Object> request) {
        try {
            String fileName = (String) request.get("fileName");
            @SuppressWarnings("unchecked")
            Map<String, Object> viewData = (Map<String, Object>) request.get("view");
            
            if (fileName == null || viewData == null) {
                return ResponseEntity.badRequest().build();
            }
            
            DecisionTableView view = convertToDecisionTableView(viewData);
            
            excelService.saveDecisionTable(fileName, view);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Saved successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Save failed: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/add-column")
    public ResponseEntity<Map<String, String>> addColumn(@RequestBody Map<String, String> request) {
        try {
            String fileName = request.get("fileName");
            String columnType = request.get("columnType");
            String columnName = request.get("columnName");
            String templateValue = request.get("templateValue");
            
            if (fileName == null || columnType == null || columnName == null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Missing required parameters");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            if (!columnType.equals("CONDITION") && !columnType.equals("ACTION")) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Column type must be CONDITION or ACTION");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            excelService.addColumn(fileName, columnType, columnName, templateValue != null ? templateValue : "");
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Column added successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to add column: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/delete-column")
    public ResponseEntity<Map<String, String>> deleteColumn(@RequestBody Map<String, Object> request) {
        try {
            String fileName = (String) request.get("fileName");
            Integer columnIndex = (Integer) request.get("columnIndex");
            
            if (fileName == null || columnIndex == null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Missing required parameters");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            excelService.deleteColumn(fileName, columnIndex);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Column deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to delete column: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    @PostMapping("/execute-rules")
    public ResponseEntity<Map<String, Object>> executeRules(@RequestBody Map<String, Object> request) {
        try {
            String fileName = (String) request.get("fileName");
            @SuppressWarnings("unchecked")
            Map<String, Object> inputData = (Map<String, Object>) request.get("inputData");
            
            if (fileName == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "fileName is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            DecisionTableView tableView = excelService.readDecisionTable(fileName);
            
            if (!droolsService.validateDroolsDecisionTableStructure(tableView)) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Invalid Drools decision table structure");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            Map<String, Object> results = droolsService.executeRules(tableView, inputData);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to execute rules: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @SuppressWarnings("unchecked")
    private DecisionTableView convertToDecisionTableView(Map<String, Object> viewData) {
        List<String> columnLabels = (List<String>) viewData.get("columnLabels");
        List<String> templateLabels = (List<String>) viewData.get("templateLabels");
        List<Map<String, Object>> rowsData = (List<Map<String, Object>>) viewData.get("rows");
        
        DecisionTableView view = new DecisionTableView();
        view.setColumnLabels(columnLabels);
        view.setTemplateLabels(templateLabels);
        
        List<com.example.droolsbackend.model.RuleRow> rows = new ArrayList<>();
        for (Map<String, Object> rowData : rowsData) {
            String name = (String) rowData.get("name");
            List<Object> values = (List<Object>) rowData.get("values");
            rows.add(new com.example.droolsbackend.model.RuleRow(name, values));
        }
        view.setRows(rows);
        
        return view;
    }
}
