import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReportWrapper = ({ title, children, filterToolbar }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {filterToolbar && (
          <div className="pt-4 border-b -mx-6 px-6 pb-4">
            {filterToolbar}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default ReportWrapper;