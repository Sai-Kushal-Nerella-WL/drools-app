package com.example.droolsbackend.controller;

import com.example.droolsbackend.model.DecisionTableView;
import com.example.droolsbackend.service.ExcelService;
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

    @SuppressWarnings("unchecked")
    private DecisionTableView convertToDecisionTableView(Map<String, Object> viewData) {
        List<String> columnLabels = (List<String>) viewData.get("columnLabels");
        List<Map<String, Object>> rowsData = (List<Map<String, Object>>) viewData.get("rows");
        
        DecisionTableView view = new DecisionTableView();
        view.setColumnLabels(columnLabels);
        
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
