#!/usr/bin/env python3
import openpyxl
from openpyxl import Workbook
import os

wb = Workbook()
ws = wb.active

ws['A1'] = 'NAME'
ws['B1'] = 'CONDITION 1'
ws['C1'] = 'CONDITION 2'
ws['D1'] = 'ACTION 1'

ws['A2'] = ''
ws['B2'] = 'customer.getAge() >= $param'
ws['C2'] = 'customer.getStatus() == "$param"'
ws['D2'] = 'customer.setDiscount($param);'

ws['A3'] = 'Rule1'
ws['B3'] = '18'
ws['C3'] = 'ACTIVE'
ws['D3'] = '0.1'

ws['A4'] = 'Rule2'
ws['B4'] = '65'
ws['C4'] = 'SENIOR'
ws['D4'] = '0.2'

ws['A5'] = 'Rule3'
ws['B5'] = '25'
ws['C5'] = 'PREMIUM'
ws['D5'] = '0.15'

os.makedirs('rules', exist_ok=True)
wb.save('rules/SampleRules.xlsx')
print("Created sample Excel file: rules/SampleRules.xlsx")
