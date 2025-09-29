package com.example.droolsbackend.service;

import com.example.droolsbackend.model.DecisionTableView;
import com.example.droolsbackend.model.RuleRow;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
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
    
    @Autowired
    private DroolsService droolsService;
    
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
            
            List<String> templateLabels = new ArrayList<>();
            Row templateRow = sheet.getRow(headerRowIndex + 1);
            if (templateRow != null) {
                for (int i = 0; i < columnLabels.size(); i++) {
                    Cell cell = templateRow.getCell(i);
                    String value = getCellValueAsString(cell);
                    templateLabels.add(value != null ? value : "");
                }
            } else {
                for (int i = 0; i < columnLabels.size(); i++) {
                    templateLabels.add("");
                }
            }
            
            return new DecisionTableView(columnLabels, templateLabels, rows);
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
    
    public void addColumn(String fileName, String columnType, String columnName, String templateValue) throws IOException {
        ensureCorrectBranch();
        String repositoryPath = repositoryConfigService.getRepositoryPath();
        if (repositoryPath == null) {
            throw new IOException("Repository not configured");
        }
        
        File excelFile = new File(repositoryPath + "/rules/" + fileName);
        
        try (FileInputStream fis = new FileInputStream(excelFile);
             Workbook workbook = new XSSFWorkbook(fis)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            Row templateRow = sheet.getRow(1);
            
            if (headerRow == null) {
                throw new IOException("Invalid Excel file: missing header row");
            }
            
            List<String> existingColumns = new ArrayList<>();
            for (Cell cell : headerRow) {
                existingColumns.add(getCellValueAsString(cell));
            }
            
            String droolsColumnName = droolsService.generateDroolsColumnName(columnType, existingColumns);
            String droolsTemplateValue = templateValue != null && !templateValue.trim().isEmpty() 
                ? templateValue 
                : droolsService.getDefaultTemplateValue(columnType);
            
            int insertPosition = findInsertPosition(headerRow, columnType);
            
            shiftColumnsRight(sheet, insertPosition);
            
            Cell newHeaderCell = headerRow.createCell(insertPosition);
            newHeaderCell.setCellValue(droolsColumnName);
            
            if (templateRow == null) {
                templateRow = sheet.createRow(1);
            }
            Cell newTemplateCell = templateRow.createCell(insertPosition);
            newTemplateCell.setCellValue(droolsTemplateValue);
            
            try (FileOutputStream fos = new FileOutputStream(excelFile)) {
                workbook.write(fos);
            }
        }
    }
    
    public void deleteColumn(String fileName, int columnIndex) throws IOException {
        ensureCorrectBranch();
        String repositoryPath = repositoryConfigService.getRepositoryPath();
        if (repositoryPath == null) {
            throw new IOException("Repository not configured");
        }
        
        File excelFile = new File(repositoryPath + "/rules/" + fileName);
        
        try (FileInputStream fis = new FileInputStream(excelFile);
             Workbook workbook = new XSSFWorkbook(fis)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            
            if (!canDeleteColumn(sheet, columnIndex)) {
                throw new IOException("Cannot delete this column: it may be required for Drools structure");
            }
            
            shiftColumnsLeft(sheet, columnIndex);
            
            try (FileOutputStream fos = new FileOutputStream(excelFile)) {
                workbook.write(fos);
            }
        }
    }
    
    public Resource downloadExcelFile(String fileName) throws IOException {
        ensureCorrectBranch();
        String repositoryPath = repositoryConfigService.getRepositoryPath();
        if (repositoryPath == null) {
            throw new IOException("Repository not configured");
        }
        
        File excelFile = new File(repositoryPath + "/rules/" + fileName);
        if (!excelFile.exists()) {
            throw new IOException("File not found: " + fileName);
        }
        
        return new FileSystemResource(excelFile);
    }
    
    private void ensureCorrectBranch() throws IOException {
        if (!repositoryConfigService.isConfigured()) {
            throw new IOException("Repository not configured");
        }
        
        String repositoryPath = repositoryConfigService.getRepositoryPath();
        String currentBranch = repositoryConfigService.getCurrentBranch();
        
        try {
            ProcessBuilder pb = new ProcessBuilder("git", "checkout", currentBranch);
            pb.directory(new File(repositoryPath));
            Process process = pb.start();
            int exitCode = process.waitFor();
            
            if (exitCode != 0) {
                throw new IOException("Failed to checkout branch: " + currentBranch);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Branch checkout interrupted", e);
        }
    }
    
    private int findInsertPosition(Row headerRow, String columnType) {
        int lastConditionIndex = -1;
        int firstActionIndex = -1;
        
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            if (cell != null) {
                String cellValue = getCellValueAsString(cell);
                if (cellValue.startsWith("CONDITION")) {
                    lastConditionIndex = i;
                } else if (cellValue.startsWith("ACTION") && firstActionIndex == -1) {
                    firstActionIndex = i;
                }
            }
        }
        
        if ("CONDITION".equals(columnType)) {
            return lastConditionIndex + 1;
        } else if ("ACTION".equals(columnType)) {
            return firstActionIndex == -1 ? headerRow.getLastCellNum() : firstActionIndex;
        }
        
        return headerRow.getLastCellNum();
    }
    
    private void shiftColumnsRight(Sheet sheet, int fromColumn) {
        for (int rowIndex = 0; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row != null) {
                int lastCellNum = row.getLastCellNum();
                for (int cellIndex = lastCellNum; cellIndex >= fromColumn; cellIndex--) {
                    Cell oldCell = row.getCell(cellIndex);
                    if (oldCell != null) {
                        Cell newCell = row.createCell(cellIndex + 1);
                        copyCellValue(oldCell, newCell);
                        row.removeCell(oldCell);
                    }
                }
            }
        }
    }
    
    private void shiftColumnsLeft(Sheet sheet, int columnToDelete) {
        for (int rowIndex = 0; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row != null) {
                int lastCellNum = row.getLastCellNum();
                for (int cellIndex = columnToDelete + 1; cellIndex < lastCellNum; cellIndex++) {
                    Cell oldCell = row.getCell(cellIndex);
                    Cell newCell = row.getCell(cellIndex - 1);
                    if (newCell == null) {
                        newCell = row.createCell(cellIndex - 1);
                    }
                    if (oldCell != null) {
                        copyCellValue(oldCell, newCell);
                    } else {
                        newCell.setBlank();
                    }
                }
                Cell lastCell = row.getCell(lastCellNum - 1);
                if (lastCell != null) {
                    row.removeCell(lastCell);
                }
            }
        }
    }
    
    private void copyCellValue(Cell source, Cell target) {
        switch (source.getCellType()) {
            case STRING:
                target.setCellValue(source.getStringCellValue());
                break;
            case NUMERIC:
                target.setCellValue(source.getNumericCellValue());
                break;
            case BOOLEAN:
                target.setCellValue(source.getBooleanCellValue());
                break;
            case FORMULA:
                target.setCellFormula(source.getCellFormula());
                break;
            default:
                target.setBlank();
                break;
        }
    }
    
    private boolean canDeleteColumn(Sheet sheet, int columnIndex) {
        Row headerRow = sheet.getRow(0);
        if (headerRow == null || columnIndex >= headerRow.getLastCellNum()) {
            return false;
        }
        
        Cell cell = headerRow.getCell(columnIndex);
        if (cell == null) {
            return true;
        }
        
        String columnName = getCellValueAsString(cell);
        return !"NAME".equals(columnName);
    }
}
