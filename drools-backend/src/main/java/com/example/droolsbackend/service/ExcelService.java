package com.example.droolsbackend.service;

import com.example.droolsbackend.model.DecisionTableView;
import com.example.droolsbackend.model.RuleRow;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class ExcelService {

    private static final String BASE_REPO_DIR = "/home/ubuntu/repos/";
    
    @Autowired
    private RepositoryConfigService repositoryConfigService;
    
    private String getRulesDirectory(String repoName, String rulesFolder) {
        String baseDir = BASE_REPO_DIR + repoName + "/";
        if (rulesFolder != null && !rulesFolder.isEmpty()) {
            return baseDir + rulesFolder + "/";
        }
        return baseDir + "rules/";
    }

    public List<String> listExcelFiles() {
        String repoName = getRepoNameFromConfig();
        String rulesFolder = getRulesFolderFromConfig();
        String rulesDir = getRulesDirectory(repoName, rulesFolder);
        File rulesDirFile = new File(rulesDir);
        List<String> excelFiles = new ArrayList<>();
        
        if (rulesDirFile.exists() && rulesDirFile.isDirectory()) {
            File[] files = rulesDirFile.listFiles((dir, name) -> name.toLowerCase().endsWith(".xlsx"));
            if (files != null) {
                for (File file : files) {
                    excelFiles.add(file.getName());
                }
            }
        }
        
        return excelFiles;
    }

    public DecisionTableView readDecisionTable(String fileName) throws IOException {
        String repoName = getRepoNameFromConfig();
        String rulesFolder = getRulesFolderFromConfig();
        String rulesDir = getRulesDirectory(repoName, rulesFolder);
        File excelFile = new File(rulesDir + fileName);
        
        try (FileInputStream fis = new FileInputStream(excelFile);
             Workbook workbook = new XSSFWorkbook(fis)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            
            Row headerRow = null;
            int headerRowIndex = -1;
            
            for (int i = 0; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    Cell firstCell = row.getCell(0);
                    if (firstCell != null && "NAME".equals(getCellValueAsString(firstCell))) {
                        headerRow = row;
                        headerRowIndex = i;
                        break;
                    }
                }
            }
            
            if (headerRow == null) {
                throw new RuntimeException("Could not find header row with NAME column");
            }
            
            List<String> columnLabels = new ArrayList<>();
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                String value = getCellValueAsString(cell);
                if (value != null && !value.trim().isEmpty()) {
                    columnLabels.add(value);
                }
            }
            
            int dataStartRow = headerRowIndex + 2;
            
            List<RuleRow> rows = new ArrayList<>();
            for (int i = dataStartRow; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    String name = getCellValueAsString(row.getCell(0));
                    if (name != null && !name.trim().isEmpty()) {
                        List<Object> values = new ArrayList<>();
                        
                        for (int j = 1; j < columnLabels.size(); j++) {
                            Cell cell = row.getCell(j);
                            Object value = getCellValue(cell);
                            values.add(value);
                        }
                        
                        rows.add(new RuleRow(name, values));
                    }
                }
            }
            
            return new DecisionTableView(columnLabels, rows);
        }
    }

    public void saveDecisionTable(String fileName, DecisionTableView view) throws IOException {
        String repoName = getRepoNameFromConfig();
        String rulesFolder = getRulesFolderFromConfig();
        String rulesDir = getRulesDirectory(repoName, rulesFolder);
        File excelFile = new File(rulesDir + fileName);
        
        try (FileInputStream fis = new FileInputStream(excelFile);
             Workbook workbook = new XSSFWorkbook(fis)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            
            int headerRowIndex = -1;
            for (int i = 0; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    Cell firstCell = row.getCell(0);
                    if (firstCell != null && "NAME".equals(getCellValueAsString(firstCell))) {
                        headerRowIndex = i;
                        break;
                    }
                }
            }
            
            if (headerRowIndex == -1) {
                throw new RuntimeException("Could not find header row");
            }
            
            int dataStartRow = headerRowIndex + 2;
            for (int i = dataStartRow; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    sheet.removeRow(row);
                }
            }
            
            for (int i = 0; i < view.getRows().size(); i++) {
                RuleRow ruleRow = view.getRows().get(i);
                Row row = sheet.createRow(dataStartRow + i);
                
                Cell nameCell = row.createCell(0);
                nameCell.setCellValue(ruleRow.getName());
                
                for (int j = 0; j < ruleRow.getValues().size(); j++) {
                    Cell cell = row.createCell(j + 1);
                    Object value = ruleRow.getValues().get(j);
                    setCellValue(cell, value);
                }
            }
            
            try (FileOutputStream fos = new FileOutputStream(excelFile)) {
                workbook.write(fos);
            }
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    return String.valueOf(cell.getNumericCellValue());
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    private Object getCellValue(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue();
                } else {
                    return cell.getNumericCellValue();
                }
            case BOOLEAN:
                return cell.getBooleanCellValue();
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    private void setCellValue(Cell cell, Object value) {
        if (value == null) {
            cell.setBlank();
        } else if (value instanceof String) {
            cell.setCellValue((String) value);
        } else if (value instanceof Number) {
            cell.setCellValue(((Number) value).doubleValue());
        } else if (value instanceof Boolean) {
            cell.setCellValue((Boolean) value);
        } else {
            cell.setCellValue(value.toString());
        }
    }
    
    private String getRepoNameFromConfig() {
        if (repositoryConfigService.isConfigured()) {
            String repoUrl = repositoryConfigService.getCurrentRepoUrl();
            String repoName = repoUrl.substring(repoUrl.lastIndexOf('/') + 1);
            if (repoName.endsWith(".git")) {
                repoName = repoName.substring(0, repoName.length() - 4);
            }
            return repoName;
        }
        return "drools-rules-lite";
    }
    
    private String getRulesFolderFromConfig() {
        return "rules";
    }
}
